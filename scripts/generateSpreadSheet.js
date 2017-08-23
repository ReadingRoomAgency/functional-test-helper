// node node_modules\eslint\bin\eslint.js generateCSV.js
/* eslint max-lines: 0 */  // --> OFF

const shell = require('shelljs');
const Excel = require('exceljs');

// For dev and debugging purposes
// const sample = require('./../programme-details.json');
// worksheet.addRows(generateRowData(sample));

/** HELPERS **/
const EXCEL_CELL_NEWLINE = String.fromCharCode(10);
const FILE_NAME = 'FreeView Functional Tests';
// @TODO any new tags must be recorded here
// otherwise a column will not be created for it on the spreadsheet
const TAGS = ['@bundleBuilder', '@TVGuide', '@mockServer', '@notFF', '@notIE'];
const TAG_NAME_MAPPING = {
  '@TVGuide': 'TV Guide',
  '@bundleBuilder': 'Bundle Builder',
  '@mockServer': 'Requires Manual Testing',
  '@notFF': 'Requires Firefox Testing',
  '@notIE': 'Requires IE Testing',
};

const excelFormat = str => str
  .replace(/\n/g, EXCEL_CELL_NEWLINE)
  .replace(/ {2}/g, ' ')
  .replace(/"/g, '\'')
  .trim();

const formatCucumberDataTable = (table) => {
  if (table.rows.length > 1) {
    const clone = table.rows.slice(0);
    const tableHeadings = clone.splice(0, 1);
    return clone.map(row =>
      tableHeadings[0].cells.map((heading, index) =>
        `${heading}: ${row.cells[index]}`)
        .join(EXCEL_CELL_NEWLINE))
      .join(`${EXCEL_CELL_NEWLINE}---${EXCEL_CELL_NEWLINE}`);
  }
  // A single row data table don't have table header
  return table.rows[0].cells.join(',');
};

const getScenarioDescription = (steps) => {
  // Ignore 'Before' and 'After' steps
  const filteredSteps = steps.filter(
    step => !['Before', 'After'].includes(step.keyword));

  const stepsPayload = filteredSteps.map((step) => {
    const scenarioDescription = `${step.keyword}${excelFormat(step.name)}`;
    if (!step.arguments.length) {
      return scenarioDescription;
    }

    let stepArguments = '';
    if (step.arguments[0].content) {
      stepArguments = step.arguments[0].content;
    } else if (step.arguments[0].rows) {
      stepArguments = formatCucumberDataTable(step.arguments[0]);
    }
    return [
      scenarioDescription,
      stepArguments,
    ].join(EXCEL_CELL_NEWLINE);
  });
  return stepsPayload.join(`${EXCEL_CELL_NEWLINE}`);
};

const getTags = (tags) =>
  tags.reduce((tot, cur) => {
    tot[cur.name] = true
    return tot;
  }, {});

const generateRowData = (feature) => {
  if (!feature) {
    return;
  }
  let description = '';
  if (feature.description) {
    description = excelFormat(feature.description);
  }

  const row = {
    feature: `${feature.name}${EXCEL_CELL_NEWLINE}${description}`,
    // eslint-disable-next-line arrow-body-style
    scenarios: feature.elements.map((scenario) => {
      return {
        name: scenario.name,
        description: getScenarioDescription(scenario.steps),
        tags: getTags(scenario.tags),
      };
    }),
  };
  // eslint-disable-next-line consistent-return
  return row.scenarios.map(scenario => [
      row.feature,
      scenario.name,
      scenario.description,
    ].concat(TAGS.map(tag => scenario.tags[tag] ? 'true' : 'false')));
};
/** HELPERS END **/

const workbook = new Excel.Workbook();
workbook.creator = 'Reading Room';
const worksheet = workbook.addWorksheet(FILE_NAME,
  {
    properties: {
      tabColor: {
        argb: 'FFC0000',
      },
    },
  });

worksheet.columns = [
  { header: 'FEATURE', key: 'FEATURE', width: 50 },
  { header: 'SCENARIO', key: 'SCENARIO', width: 40 },
  { header: 'DESCRIPTION', key: 'DESCRIPTION', width: 70 },
].concat(TAGS
  .map((tag) => { return {
    header: TAG_NAME_MAPPING[tag],
    key: TAG_NAME_MAPPING[tag],
    width: 15
  }}));

shell.cd('features');
const features = shell.ls('*.feature').map(file => file);
shell.cd('..');
features.forEach((file) => {
  // eslint-disable-next-line no-console
  console.error(`Parsing feature ${file}`);
  const featureJson = shell
    // eslint-disable-next-line max-len
    .exec(`node node_modules/cucumber/bin/cucumber.js -f json features/${file}`, {
      silent: true,
    });
  const row = generateRowData(JSON.parse(featureJson.stdout)[0]);
  if (row) {
    worksheet.addRows(row);
  }
});

// Align and wrap all cells content
['FEATURE', 'SCENARIO', 'DESCRIPTION'].concat(TAGS.map(tag => TAG_NAME_MAPPING[tag])).forEach((column) => {
  const col = worksheet.getColumn(column);
  col.eachCell((cell) => {
    // eslint-disable-next-line no-param-reassign
    cell.alignment = {
      vertical: 'top',
      horizontal: 'left',
      wrapText: true,
    };
  });
});

// Style header row
['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1', 'K1', 'L1', 'M1', 'N1', 'O1', 'P1', 'Q1'].forEach((header) => {
  const cell = worksheet.getCell(header);

  cell.alignment = {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: true,
  }

  cell.font = {
    color: {
      argb: 'ffffff',
    },
    underline: true,
    bold: true,
  };

  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: {
      argb: '49425c',
    },
  };
});

// Freeze the header row
worksheet.views = [
  {
    state: 'frozen',
    ySplit: 1,
  },
];

workbook.xlsx.writeFile(`${FILE_NAME}.xlsx`)
  .then((e) => {
    if (e) {
      throw new Error(e);
    }
    // eslint-disable-next-line no-console
    console.error(`${FILE_NAME}.xlsx completed`);
  });
