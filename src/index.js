/* Original code by matt vogel */

import createObserver from "roamjs-components/dom/createObserver";
import createIconButton from "roamjs-components/dom/createIconButton"

var runners = {
  observers: [],
}

function download_table_as_csv(block_id, separator = ',', isQueryTable = false) {
  let rows;
  if (isQueryTable) {
    // Handle query tables
    const blockContainer = document.querySelector(`[id$="${block_id}"]`);
    if (!blockContainer) return;
    const queryTable = blockContainer.querySelector('.rm-ds-q .rm-data-table__table table');
    if (!queryTable) return;
    rows = queryTable.querySelectorAll('tr');
  } else {
    // Handle regular tables
    rows = document.querySelectorAll("#" + block_id + ' .roam-table' + ' tr');
  }

  if (!rows.length) return;

  // Construct csv
  const csv = [];
  for (let i = 0; i < rows.length; i++) {
    const row = [];
    let cols;
    
    if (isQueryTable) {
      // For query tables, get cells but exclude the last column (controls)
      cols = rows[i].querySelectorAll('th, td.rm-data-table__table__cell-container');
      for (let j = 0; j < cols.length - 1; j++) {
        let data = '';
        if (cols[j].querySelector('.rm-column-header__name')) {
          data = cols[j].querySelector('.rm-column-header__name').innerText;
        } else {
          data = cols[j].innerText;
        }
        // Clean and escape data
        data = data.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ').trim();
        data = data.replace(/"/g, '""');
        row.push('"' + data + '"');
      }
    } else {
      // For regular tables, process all columns
      cols = rows[i].querySelectorAll('td, th');
      for (let j = 0; j < cols.length; j++) {
        let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ');
        data = data.replace(/"/g, '""');
        row.push('"' + data + '"');
      }
    }

    if (row.length > 0) {
      csv.push(row.join(separator));
    }
  }

  const csv_string = csv.join('\n');
  
  // Download it
  const prefix = isQueryTable ? 'query_export_' : 'export_';
  const filename = prefix + new Date().toLocaleDateString() + '.csv';
  const link = document.createElement('a');
  link.style.display = 'none';
  link.setAttribute('target', '_blank');
  link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function createButton(blockID, DOMLocation, isQueryTable = false) {
  const mainButton = createIconButton("download");
  mainButton.classList.add("download-table-button", "dont-focus-block");
  mainButton.onclick = () => {
    download_table_as_csv(blockID, ',', isQueryTable);
  }

  if (isQueryTable) {
    // For query tables, add button to the header controls
    const controlsContainer = DOMLocation.querySelector('.rm-column-header--fake .bp3-button-group');
    if (controlsContainer) {
      mainButton.classList.add('bp3-button', 'bp3-minimal', 'bp3-small');
      controlsContainer.insertAdjacentElement("afterbegin", mainButton);
    }
  } else {
    // Original logic for regular tables
    if (DOMLocation.querySelector("thead")) {
      const firstCell = DOMLocation.getElementsByTagName("th")[0];
      mainButton.classList.add('hoveronly');
      firstCell.insertAdjacentElement("beforeend", mainButton);
    } else {
      const hoverHide = DOMLocation.querySelector(".hoveronly");
      if (hoverHide) {
        hoverHide.insertAdjacentElement("afterbegin", mainButton);
        hoverHide.appendChild(mainButton);
      }
    }
  }
}

async function onload() {
  var tableObserver = createObserver(() => {
    // Handle regular tables
    if (document.querySelectorAll(".rm-table")) {
      // Regular tables
      document.querySelectorAll(".rm-table").forEach(function(tableBlock) {
        if(tableBlock.querySelector("table.dont-focus-block")) {
          let checkForButton = tableBlock.getElementsByClassName('download-table-button').length;
          if (!checkForButton) {
            let blockID = tableBlock.closest(".roam-block").id;
            createButton(blockID, tableBlock, false);
          }
        } 
      });

      // Attribute tables
      document.querySelectorAll(".roam-table").forEach(function(tableBlock) {
        if(!tableBlock.querySelector("table.dont-focus-block")) {
          let checkForButton = tableBlock.getElementsByClassName('download-table-button').length;
          if (!checkForButton) {
            let blockID = tableBlock.closest(".roam-block").id;
            createButton(blockID, tableBlock, false);
          }
        } 
      });
    }

    // Handle query tables
    if (document.querySelectorAll(".rm-ds-q")) {
      document.querySelectorAll(".rm-ds-q").forEach(function(queryBlock) {
        let checkForButton = queryBlock.getElementsByClassName('download-table-button').length;
        if (!checkForButton) {
          let blockID = queryBlock.closest(".rm-block__input").id;
          createButton(blockID, queryBlock, true);
        }
      });
    }
  });

  runners['observers'] = [tableObserver];
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