import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";

export function useProfileFlowActions({
  currentUserId,
  photoBusy,
  setPhotoBusy,
  showNotice,
  setProfile,
  refreshCoreData,
  role,
  waiterFormDirty,
  managerFormDirty,
  setFormError,
  applyProfileToForms,
  profile,
  profileBackTarget,
  setScreen,
  setRole,
  askConfirm,
}) {
    const pickProfilePhoto = async () => {
      if (!currentUserId || photoBusy) return;
      setPhotoBusy(true);
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          showNotice("Permite accesul la fotografii pentru a alege poza de profil.", "error");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.78,
          base64: true,
        });
        if (result.canceled) return;
        const asset = result.assets?.[0];
        if (!asset?.base64) return showNotice("Fotografia nu a putut fi citită.", "error");
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          return showNotice("Alege o fotografie mai mică de 5 MB.", "error");
        }

        const mimeType = asset.mimeType || "image/jpeg";
        const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
        const objectPath = `${currentUserId}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("turax-avatars")
          .upload(objectPath, decode(asset.base64), { contentType: mimeType, upsert: true, cacheControl: "3600" });
        if (uploadError) return showNotice(uploadError.message, "error");

        const { data: publicData } = supabase.storage.from("turax-avatars").getPublicUrl(objectPath);
        const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`;
        const { data: updatedProfile, error: profileError } = await supabase
          .rpc("sync_my_avatar", { p_avatar_url: publicUrl })
          .single();
        if (profileError) return showNotice(profileError.message, "error");

        setProfile(updatedProfile);
        await refreshCoreData(true);
        showNotice(role === "manager" ? "Logo-ul locației a fost actualizat." : "Poza de profil a fost actualizată.");
      } catch (e) {
        showNotice(e?.message || "Fotografia nu a putut fi încărcată.", "error");
      } finally {
        setPhotoBusy(false);
      }
    };

    const requestProfileBack = (kind) => {
      const dirty = kind === "waiter" ? waiterFormDirty : managerFormDirty;
      const leave = () => {
        setFormError("");
        applyProfileToForms(profile);
        if (profileBackTarget === "profile") {
          setScreen("profile");
        } else {
          setRole(null);
          setScreen("home");
        }
      };
      if (!dirty) return leave();
      askConfirm({
        title: "Renunți la modificări?",
        message: "Ai modificări nesalvate în profil.",
        confirmLabel: "Renunță",
        cancelLabel: "Rămân aici",
        danger: true,
        onConfirm: leave,
      });
    };

  return {
    pickProfilePhoto,
    requestProfileBack,
  };
}
