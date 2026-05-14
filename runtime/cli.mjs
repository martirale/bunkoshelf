const [, , command, ...args] = process.argv;

function parseInitArgs(rawArgs) {
  const options = {
    cloud: false,
  };
  let projectName;

  for (const arg of rawArgs) {
    if (arg === "--cloud") {
      options.cloud = true;
      continue;
    }

    if (!projectName) {
      projectName = arg;
    }
  }

  return { projectName, options };
}

switch (command) {
  case "init": {
    const { init } = await import("./commands/init.mjs");
    const { projectName, options } = parseInitArgs(args);
    await init(projectName, options);
    break;
  }
  case "start": {
    const { start } = await import("./commands/start.mjs");
    await start();
    break;
  }
  case "update": {
    const { update } = await import("./commands/update.mjs");
    await update(args[0]);
    break;
  }
  default:
    if (command && !command.startsWith("-")) {
      const { init } = await import("./commands/init.mjs");
      const { options } = parseInitArgs(args);
      await init(command, options);
    } else {
      console.error("Usage: bunkoshelf <init|start|update> [project-name|version]");
      process.exit(1);
    }
}
