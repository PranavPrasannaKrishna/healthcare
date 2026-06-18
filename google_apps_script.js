/**
 * Google Apps Script - HealthBridges Form Lead Capture
 * 
 * Instructions:
 * 1. Create a Google Sheet.
 * 2. In the Google Sheet, go to Extensions > Apps Script.
 * 3. Delete any code in the editor and paste this code.
 * 4. Click Save (disk icon).
 * 5. Click "Deploy" (top right) > "New deployment".
 * 6. Select Type: "Web app".
 * 7. Set Description: "HealthBridges Leads API".
 * 8. Set "Execute as": "Me (your-email)".
 * 9. Set "Who has access": "Anyone" (crucial so the website can post to it).
 * 10. Click "Deploy" and authorize access if requested.
 * 11. Copy the "Web app URL" and paste it in app.js under GOOGLE_SHEETS_URL.
 */

function doPost(e) {
  try {
    // Open the active spreadsheet sheet
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();
    
    // Parse the incoming lead JSON body
    var data = JSON.parse(e.postData.contents);
    
    // Auto-create table header row if the sheet is brand new/empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", 
        "Name", 
        "Relationship", 
        "Email", 
        "WhatsApp Phone", 
        "Parent City"
      ]);
      
      // Style header row to look neat
      sheet.getRange(1, 1, 1, 6)
           .setFontWeight("bold")
           .setBackground("#0F172A")
           .setFontColor("#FFFFFF")
           .setHorizontalAlignment("center");
    }
    
    // Append the row of data
    sheet.appendRow([
      new Date(),
      data.name,
      data.relation,
      data.email,
      data.phone,
      data.parentCity
    ]);
    
    // Return a JSON response confirming success
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    // Return error log if anything fails
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
