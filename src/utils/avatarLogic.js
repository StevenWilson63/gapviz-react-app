// src/utils/avatarLogic.js

export function getAvatarDisplay({ photo, nickname, firstName, surname }) {
  if (photo) {
    return { type: "photo", value: photo };
  }

  if (nickname && nickname.trim()) {
    return {
      type: "initials",
      value: nickname.trim()[0].toUpperCase(),
    };
  }

  const fn = firstName?.trim() || "";
  const sn = surname?.trim() || "";

  if (fn || sn) {
    const initials = `${fn[0] || ""}${sn[0] || ""}`.toUpperCase();
    return {
      type: "initials",
      value: initials || "",
    };
  }

  return { type: "initials", value: "" };
}
