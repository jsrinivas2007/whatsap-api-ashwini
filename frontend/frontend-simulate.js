const fs = require('fs');

async function testParse() {
  const text = fs.readFileSync('../test-contacts.csv', 'utf8');
  console.log("FRONTEND RAW TEXT LENGTH:", text.length, "FIRST 200 CHARS:", text.substring(0, 200));

  const [header, ...rows] = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);

  console.log("FRONTEND PARSED HEADER:", header);
  const columns = header.split(",").map((item) => item.trim().toLowerCase());
  console.log("FRONTEND PARSED COLUMNS:", columns);

  const contacts = rows
    .map((row, index) => {
      const cells = row.split(",");
      const countryCode =
        cells[columns.indexOf("countrycode")]?.replace(/\D/g, "") ?? "";
      const whatsapp =
        cells[columns.indexOf("whatsapp")]?.replace(/\D/g, "") ?? "";
      
      const mappedContact = {
        id: ``,
        name: cells[columns.indexOf("name")]?.trim() || "Unnamed",
        country_code: countryCode,
        whatsapp_number: whatsapp,
        source: "csv_upload",
        tags: [],
        attributes: {},
      };
      console.log(`FRONTEND ROW ${index + 1}:`, row, "MAPPED TO:", mappedContact);
      return mappedContact;
    })
    .filter((contact) => contact.whatsapp_number.length >= 7);

  console.log("FRONTEND FINAL FILTERED CONTACTS COUNT:", contacts.length, contacts);
}

testParse();
