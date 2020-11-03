# i3-keyboard-input-switcher

A simple script to switch keyboard layouts that remembers which layout each app had.

## Requirements

nodejs 12+

## How to use

Edit your ```~/.config/i3/config``` and add the following line

```
# Start the server part with your selected layouts
exec --no-startup-id i3-keyboard-switcher us se

# Add a bindind for switching
bindsym $mod+space exec i3-keyboard-switcher switch
