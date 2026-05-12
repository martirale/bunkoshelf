const [, , command, ...args] = process.argv;

switch (command) {
  case "init": {
    const { init } = await import("./commands/init.mjs");
    await init(args[0]);
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
      await init(command);
    } else {
      console.error("Usage: bunkoshelf <init|start|update> [project-name|version]");
      process.exit(1);
    }
}
