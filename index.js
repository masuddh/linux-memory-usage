const { execSync } = require('child_process');
const { Table } = require('console-table-printer');

function getAllProcesses() {
  try {
    const output = execSync('ps -e -o pid=,comm=');
    const processes = output.toString().trim().split('\n');
    return processes.map((process) => {
      const [pid, name] = process.trim().split(' ');
      return { pid: parseInt(pid), name };
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return [];
  }
}

function getMemoryUsage(pid) {
  try {
    const output = execSync(`ps -p ${pid} -o rss=,vsz=`);
    const [rss, vsz] = output.toString().trim().split(/\s+/);
    const memoryUsage = parseInt(rss || vsz);
    const memoryUsageMb = memoryUsage / 1024; 
    return memoryUsageMb;
  } catch (error) {
    if (error.stderr && error.stderr.toString().includes('No such process')) {
      console.error(`Process with PID ${pid} not found.`);
    }
    return null;
  }
}

function main() {
  const allProcesses = getAllProcesses();

  allProcesses.forEach((process) => {
    const memoryUsage = getMemoryUsage(process.pid);
    process.memoryUsage = memoryUsage !== null ? memoryUsage : -1;
  });

  allProcesses.sort((a, b) => b.memoryUsage - a.memoryUsage);

  const table = new Table();
  table.addColumns([{ name: 'PID', alignment: 'left' }, { name: 'Process Name', alignment: 'left' }, { name: 'Memory Usage (MB)', alignment: 'left' }]);

  allProcesses.forEach((process) => {
    if (process.memoryUsage !== -1) {
      table.addRow({ PID: process.pid, 'Process Name': process.name, 'Memory Usage (MB)': process.memoryUsage.toFixed(2) });
    }
  });

  console.log('Memory Usage for Each Process:');
  table.printTable();
}

main();
