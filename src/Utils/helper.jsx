// utils->helper.jsx
export function bufferToBase64Image(bufferObj) {
  if (!bufferObj || !bufferObj.data) return null;
  const base64String = btoa(
    new Uint8Array(bufferObj.data).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );
  return `data:image/jpeg;base64,${base64String}`;
}
