export function uploadWithProgress(
  url: string,
  body: FormData,
  headers: Record<string, string>,
  onProgress: (percent: number) => void,
): Promise<{ ok: boolean; status: number; data: () => Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    };

    xhr.onload = () => {
      onProgress(100);
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        data: () => {
          try { return Promise.resolve(JSON.parse(xhr.responseText)); }
          catch { return Promise.resolve({}); }
        },
      });
    };

    xhr.onerror = () => reject(new Error("Erreur réseau."));
    xhr.ontimeout = () => reject(new Error("Délai dépassé."));
    xhr.send(body);
  });
}
