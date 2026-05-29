export const apiBase = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

export async function requestJson(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? safeParse(text) : null;

  if (!response.ok) {
    const message =
      data && typeof data === "object"
        ? data.detail || Object.values(data).flat().filter(Boolean).join(" ")
        : text || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function uploadSourceFile(form) {
  const payload = new FormData();
  payload.append("organization_id", form.organization_id);
  payload.append("source_type", form.source_type);
  payload.append("filename", form.filename || form.file.name);
  payload.append("file", form.file);

  return requestJson("/source-files/upload/", {
    method: "POST",
    body: payload,
  });
}

export async function updateSourceFile(id, payload) {
  return requestJson(`/source-files/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteSourceFile(id) {
  return requestJson(`/source-files/${id}/`, {
    method: "DELETE",
  });
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
