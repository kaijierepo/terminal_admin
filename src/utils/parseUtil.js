export function parseINIConstructor(content, field) {
  const result = {};
  let currentSection = "";
  content.split("\n").forEach((line) => {
    line = line.trim();
    if (line.startsWith("[") && line.endsWith("]")) {
      currentSection = line.substring(1, line.length - 1);
      result[currentSection] = {};
    } else if (line.includes("=")) {
      const parts = line.split("=");
      const key = parts[0].trim();
      const conf = parts[1].split("#");
      result[currentSection][key] = {
        value: conf[0].trim(),
        comment: conf[1],
      };
    }
  });
  if (!field) return result;
  return result[field];
}
