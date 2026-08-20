import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function componentValue(components: any[] | undefined, wanted: string[]) {
  if (!Array.isArray(components)) return "";
  for (const type of wanted) {
    const match = components.find(
      (c) => Array.isArray(c?.types) && c.types.includes(type)
    );
    if (match?.longText) return match.longText;
  }
  return "";
}

function normalizeSuggestions(googleBody: any) {
  return (googleBody?.suggestions ?? [])
    .map((item: any) => item?.placePrediction)
    .filter(Boolean)
    .slice(0, 5)
    .map((p: any) => ({
      placeId:
        p.placeId ?? String(p.place ?? "").replace("places/", ""),
      text: p.text?.text ?? "",
      mainText:
        p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondaryText:
        p.structuredFormat?.secondaryText?.text ?? "",
      types: Array.isArray(p.types) ? p.types : [],
    }))
    .filter((s: any) => s.placeId && s.text);
}

function alreadyHasStreetPrefix(input: string) {
  return /^(strada|str\.?|calea|bulevardul|bulevard|bd\.?|aleea|piața|piata|splaiul|șoseaua|soseaua)\b/i.test(
    input.trim()
  );
}

function streetFriendlyInput(input: string) {
  const parts = input.split(",");
  const streetPart = String(parts.shift() ?? "").trim();
  const localityPart = parts.join(",").trim();

  if (!streetPart || alreadyHasStreetPrefix(streetPart)) return input;

  return localityPart
    ? `Strada ${streetPart}, ${localityPart}`.slice(0, 160)
    : `Strada ${streetPart}`.slice(0, 160);
}

async function googleAutocomplete(
  input: string,
  cityOnly: boolean,
  sessionToken?: string
) {
  const requestBody: Record<string, unknown> = {
    input,
    languageCode: "ro",
    regionCode: "RO",
    includedRegionCodes: ["ro"],
    includeQueryPredictions: false,
  };

  if (cityOnly) {
    requestBody.includedPrimaryTypes = ["(cities)"];
  } else {
    requestBody.includedPrimaryTypes = [
      "route",
      "street_address",
      "premise",
      "subpremise",
      "neighborhood",
    ];
  }

  if (sessionToken) requestBody.sessionToken = sessionToken;

  const googleRes = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY!,
      },
      body: JSON.stringify(requestBody),
    }
  );

  const googleBody = await googleRes.json();
  return { googleRes, googleBody };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!GOOGLE_PLACES_API_KEY) {
    console.error("GOOGLE_PLACES_API_KEY is not configured");
    return json({ error: "Places service is not configured" }, 500);
  }

  let payload: any;

  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = payload?.action;

  try {
    if (action === "autocomplete") {
      const input = String(payload?.input ?? "")
        .trim()
        .slice(0, 160);

      if (input.length < 2) {
        return json({ suggestions: [] });
      }

      const cityOnly = payload?.cityOnly === true;

      const sessionToken =
        typeof payload?.sessionToken === "string"
          ? payload.sessionToken.slice(0, 128)
          : undefined;

      const primaryInput = cityOnly
        ? input
        : streetFriendlyInput(input);

      let { googleRes, googleBody } = await googleAutocomplete(
        primaryInput,
        cityOnly,
        sessionToken
      );

      if (!googleRes.ok) {
        console.error(
          "Places autocomplete failed",
          googleRes.status,
          googleBody?.error?.status ?? "unknown"
        );

        return json(
          { error: "Places autocomplete failed" },
          502
        );
      }

      let suggestions = normalizeSuggestions(googleBody);

      if (
        !cityOnly &&
        suggestions.length === 0 &&
        primaryInput !== input
      ) {
        const retry = await googleAutocomplete(
          input,
          false,
          sessionToken
        );

        if (retry.googleRes.ok) {
          suggestions = normalizeSuggestions(retry.googleBody);
        } else {
          console.error(
            "Places autocomplete fallback failed",
            retry.googleRes.status,
            retry.googleBody?.error?.status ?? "unknown"
          );
        }
      }

      return json({ suggestions });
    }

    if (action === "details") {
      const placeId = String(payload?.placeId ?? "").trim();

      if (!/^[A-Za-z0-9_\-]+$/.test(placeId)) {
        return json({ error: "Invalid placeId" }, 400);
      }

      const sessionToken =
        typeof payload?.sessionToken === "string"
          ? payload.sessionToken.slice(0, 128)
          : "";

      const params = new URLSearchParams({
        languageCode: "ro",
        regionCode: "RO",
      });

      if (sessionToken) {
        params.set("sessionToken", sessionToken);
      }

      const googleRes = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(
          placeId
        )}?${params.toString()}`,
        {
          headers: {
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask":
              "id,displayName,formattedAddress,location,addressComponents,types",
          },
        }
      );

      const place = await googleRes.json();

      if (!googleRes.ok) {
        console.error(
          "Place details failed",
          googleRes.status,
          place?.error?.status ?? "unknown"
        );

        return json({ error: "Place details failed" }, 502);
      }

      const city = componentValue(place.addressComponents, [
        "locality",
        "postal_town",
        "administrative_area_level_2",
      ]);

      const streetName = componentValue(
        place.addressComponents,
        ["route"]
      );

      const streetNumber = componentValue(
        place.addressComponents,
        ["street_number"]
      );

      const street = [streetName, streetNumber]
        .filter(Boolean)
        .join(" ")
        .trim();

      return json({
        place: {
          placeId: place.id ?? placeId,
          name: place.displayName?.text ?? "",
          formattedAddress: place.formattedAddress ?? "",
          city,
          street,
          latitude: place.location?.latitude ?? null,
          longitude: place.location?.longitude ?? null,
          types: Array.isArray(place.types)
            ? place.types
            : [],
        },
      });
    }

    return json({ error: "Unsupported action" }, 400);
  } catch (error) {
    console.error(
      "places-autocomplete unexpected error",
      error instanceof Error
        ? error.message
        : String(error)
    );

    return json(
      { error: "Unexpected Places service error" },
      500
    );
  }
});
