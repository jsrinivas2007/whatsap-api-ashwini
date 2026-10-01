export function parseContactsCSV(text: string) {
  const rows = text
    .replace(/^\uFEFF/, "") // Remove BOM
    .split(/\r?\n/)
    .filter(row => row.trim().replace(/,/g, '').length > 0); // Ignore blank rows

  if (rows.length === 0) {
    return { count: 0, contacts: [] };
  }

  const header = rows[0].split(",").map(c => c.trim().toLowerCase());
  
  const contacts = rows.slice(1).map(row => {
    const cells = row.split(",");
    
    // Safely extract and clean values
    const name = cells[header.indexOf("name")]?.trim() || "Unnamed";
    const countryCode = header.includes("countrycode") 
      ? cells[header.indexOf("countrycode")]?.replace(/\D/g, "") 
      : "";
    const whatsapp = header.includes("whatsapp") 
      ? cells[header.indexOf("whatsapp")]?.replace(/\D/g, "") 
      : "";

    return {
      name,
      country_code: countryCode,
      whatsapp_number: whatsapp
    };
  }).filter(c => c.whatsapp_number && c.whatsapp_number.length >= 7);

  return {
    count: Math.max(0, rows.length - 1),
    contacts
  };
}
