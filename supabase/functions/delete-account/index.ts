import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Utilizator neautentificat." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configurația Supabase lipsește.");
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Identificăm sigur utilizatorul care a apelat funcția.
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Sesiunea nu mai este validă." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;

    // Ștergem întâi fotografiile/logo-urile utilizatorului.
    const { data: files, error: listError } = await admin.storage
      .from("turax-avatars")
      .list(userId, {
        limit: 100,
      });

    if (listError) {
      throw new Error(
        `Fotografiile contului nu au putut fi verificate: ${listError.message}`
      );
    }

    if (files?.length) {
      const paths = files
        .filter((file) => file.name)
        .map((file) => `${userId}/${file.name}`);

      if (paths.length) {
        const { error: removeError } = await admin.storage
          .from("turax-avatars")
          .remove(paths);

        if (removeError) {
          throw new Error(
            `Fotografiile contului nu au putut fi șterse: ${removeError.message}`
          );
        }
      }
    }

    // Ștergere definitivă Auth.
    // Relațiile ON DELETE CASCADE / SET NULL vor curăța datele asociate.
    const { error: deleteError } =
      await admin.auth.admin.deleteUser(userId, false);

    if (deleteError) {
      throw new Error(
        `Contul nu a putut fi șters: ${deleteError.message}`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contul a fost șters definitiv.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("delete-account:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Ștergerea contului a eșuat.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
