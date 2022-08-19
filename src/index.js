import createObserver from "roamjs-components/dom/createObserver";
import createIconButton from "roamjs-components/dom/createIconButton"

var runners = {
  menuItems: [],
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

function createButton(blockUID, DOMLocation){
  const createCopyButton = () => {
      const copySpan = document.createElement("span");
      copySpan.className = "download-table-button";

      const copyButton = document.createElement("button");
      copyButton.innerText  = `Copy`;
      copyButton.className = "bp3-button bp3-minimal bp3-small";
      copyButton.id = blockUID;
      copySpan.appendChild(copyButton);

      return copySpan;
  };

  // check if a button exists
  let checkForButton = DOMLocation.getElementsByClassName('download-table-button').length;

  if (!checkForButton) {
      var mainButton = createIconButton("download");
      var settingsBar = DOMLocation.getElementsByTagName("th")[0];
      
      mainButton.addEventListener("click", copyCode, false);

      settingsBar.insertAdjacentElement("beforebegin", mainButton);
      console.log(DOMLocation.getElementsByClassName('download-table-button'))
  }   
}



async function onload({ extensionAPI }) {
  // set defaults if they dont' exist
  var tableObserver = createObserver(() => {
    if ( document.querySelectorAll(".roam-table")) {
        let tableBlocks = document.querySelectorAll(".roam-table")
        for (let i = 0; i < tableBlocks.length; i++) {
          // get the blockuid from the parent div.id
          let blockID = tableBlocks[i].closest(".roam-block").id
          let blockUID = blockID.split("-")
          blockUID = blockUID[blockUID.length - 1]

          // add the copy button
          const downloadButton =  createButton(blockUID, tableBlocks[i])
          downloadButton.onclick = () => {
            download_table_as_csv(blockID)
          }
      }
    }
    });
    runners['observers'] = [tableObserver]

  console.log("load export table plugin");
}

function onunload() {
  // loop through observers and disconnect
  for (let index = 0; index < runners['observers'].length; index++) {
    const element = runners['observers'][index];
    element.disconnect()
  }

  console.log("unload export table plugin");
}

export default {
  onload,
  onunload
};
