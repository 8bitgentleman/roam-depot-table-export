/* Original code by matt vogel */

import createObserver from "roamjs-components/dom/createObserver";
import createIconButton from "roamjs-components/dom/createIconButton"

var runners = {
  observers: [],
}

function download_table_as_csv(block_id, separator = ',') {
  // Select rows from table_id
  var rows = document.querySelectorAll("#" + block_id + ' .roam-table' + ' tr');
  // Construct csv
  var csv = [];
  for (var i = 0; i < rows.length; i++) {
    var row = [], cols = rows[i].querySelectorAll('td, th');
    for (var j = 0; j < cols.length; j++) {
      // Clean innertext to remove multiple spaces and jumpline (break csv)
      var data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
      // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
      data = data.replace(/"/g, '""');
      // Push escaped string
      row.push('"' + data + '"');
    }
    csv.push(row.join(separator));
  }
  var csv_string = csv.join('\n');
  // Download it
  var filename = 'export_' + new Date().toLocaleDateString() + '.csv';
  var link = document.createElement('a');
  link.style.display = 'none';
  link.setAttribute('target', '_blank');
  link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function createButton(blockID, DOMLocation){
  // create the icon button
    var mainButton = createIconButton("download");
    mainButton.classList.add("download-table-button");
    mainButton.onclick = () => {
      download_table_as_csv(blockID)
    }
    mainButton.setAttribute("style", "float: right; z-index: 10;");

    // attr tables have a slightly different HTML structure 
    if (DOMLocation.querySelector("thead")) {
      var firstCell = DOMLocation.getElementsByTagName("th")[0]
    } else {
        var firstCell = DOMLocation.getElementsByTagName("td")[0]
    }
    
    firstCell.insertAdjacentElement("beforeend", mainButton);
  
}



async function onload({ extensionAPI }) {
// create observer
  var tableObserver = createObserver(() => {
    if ( document.querySelectorAll(".roam-table")) {
        let tableBlocks = document.querySelectorAll(".roam-table")
        for (let i = 0; i < tableBlocks.length; i++) {
          // only move forward if a dl button doesn't exist
          let checkForButton = tableBlocks[i].getElementsByClassName('download-table-button').length;
          if (!checkForButton) {
            // get the blockid from the parent div.id
            let blockID = tableBlocks[i].closest(".roam-block").id
            
            // add the copy button
            createButton(blockID,tableBlocks[i])
            
          }
          
      }
    }
    });
    // add to the global list of observers
    runners['observers'] = [tableObserver]

  console.log("load export table plugin");
}

function onunload() {
  // loop through observers and disconnect
  for (let index = 0; index < runners['observers'].length; index++) {
    const element = runners['observers'][index];
    element.disconnect()
  }
  // remove all parts of the button
  const buttons = document.querySelectorAll('.download-table-button');
  buttons.forEach(btn => {
      btn.remove();
  });
  console.log("unload export table plugin");
}

export default {
  onload,
  onunload
};
