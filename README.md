# i3-keyboard-input-switcher

A simple script to switch keyboard layouts that remembers which layout each app had.

## Requirements

nodejs 12+

## How to use

Install it globally

```npm install -g i3-keyboard-input-switcher```

Edit your ```~/.config/i3/config``` and add the following line

```
# Start the server part with your selected layouts
exec --no-startup-id i3-keyboard-switcher us se

# Add a bindind for switching
bindsym $mod+space exec i3-keyboard-switcher switch
```

## Advanced config

If you wich to configurate the switcher a little more, place a ```config.json``` file in ```$HOME/.config/i3-keyboard-switcher``` with:

```json
{
    "port": 21111, // Custom port, defaults to 18888
    "inputs": ["us", "se"], // Inputs, instead of adding them as arguments in i3 config
    "predefined": {
        "gnome-terminal-server": "us" // Predefined apps that should have a specific input
    },
    "logFile": "/home/camilo/testlog.log", // Custom logifle path
    "log": "console" // false || true || console. If false, nothing is logged, if true we use the file. If console, we use the normal nodejs console.log
}
```
