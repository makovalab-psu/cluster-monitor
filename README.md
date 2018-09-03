# cluster-monitor

Here's a system to make the current jobs, usage, resources, etc. of the slurm cluster viewable in a web browser.

## How it works

### Backend

The core is `smonitor.sh`, which uses commands like `squeue` and `sinfo` to print stats on cluster usage to a bunch of text files in my `public_html` directory. I run this every minute via a cron job. Then, anyone can just view the text files in a browser.

### Frontend

Because I wanted to try something fancy, and because I'd always get tricked by outdated status files when my smonitor scripts died, I wrote a small Javascript app that auto-updates the info from the server and warns you when it's outdated.

If you place the html files in the same `public_html` directory the `smonitor.sh` script writes to, then you can view, say, `jobs.html` in your browser and it'll periodically pull the `jobs.txt` output of `smonitor.sh`. It checks how old the text file is and displays the age to the user. There's a different html file for each of the status text files.

## Setup

### Quick and simple

The cron job that runs `smonitor.sh` isn't able to actually write the status files directly to `public_html`, because of permissions.

A simple workaround is to have it write its files to some directory it does have permissions for, and manually launch `smonitor-cp.sh` in the background, which will periodically copy the files to your `public_html`.

#### Set up cron job

First, create a directory cron can write the files to. One that worked for me is my `/galaxy/home` directory:
`$ mkdir -p /galaxy/home/$USER/cron/monitor`

Then, run crontab to edit your cron jobs:
`$ crontab -e`
Go to the end, and add this line:
```bash
* * * * * bash $HOME/code/monitor/smonitor.sh /galaxy/home/$USER/cron/monitor
```
But replace $HOME with your home directory (or wherever the script is), and $USER with your username.  
For example:
```bash
* * * * * bash /afs/bx.psu.edu/user/n/nick/code/monitor/smonitor.sh /galaxy/home/nick/cron/monitor
```

#### Launch file copying daemon

Then, while logged into an ssh session on Desmond, launch `smonitor-cp.sh` in the background. Use `nohup` to protect it from dying when you log out or if the ssh session dies:
`$ nohup ~/code/monitor/smonitor-cp.sh /galaxy/home/$USER/cron/monitor ~/public_html/monitor 10 >/dev/null 2>/dev/null &`
- The `10` tells it to wake up every 10 seconds to check for new files.

This should keep running for about a week or so, until the Kerberos ticket for your ssh session expires. Then, you'll have to re-launch `smonitor-cp.sh`.

### Longterm solution

Remembering to relaunch `smonitor-cp.sh` periodically can be annoying, and results in lots of downtime when you forget. There is a way to make the process totally automated from cron, but it requires using the black magic of Kerberos authentication.

#### Set up Kerberos permissions and create keytab

Unfortunately, for this option, you'll have to bother the BX admins. Here are the things they need to do, taken from Rico's notes (replace "nick" with your username):
- Create a new Kerberos principal `nick/cron` and a corresponding `nick.cron` user in AFS
- Extract a keytab for `nick/cron` and place it in `/etc/keytabs/nick/cron.keytab` on Desmond
- Allow `nick.cron` to cd to `/afs/bx.psu.edu/user/n/nick/public_html`
  - `$ fs setacl /afs/bx.psu.edu/user/n/nick nick.cron l`
  - `$ fs setacl /afs/bx.psu.edu/user/n/nick/public_html nick.cron l`
- Create a new directory for `nick.cron` to write to, and add appropriate permissions
  - `$ mkdir /afs/bx.psu.edu/user/n/nick/public_html/monitor`
  - `$ chown nick:nick /afs/bx.psu.edu/user/n/nick/public_html/monitor`
  - `$ fs setacl /afs/bx.psu.edu/user/n/nick/public_html/monitor nick.cron rlidwk`

#### Set up cron job

Run crontab to edit your cron jobs:
`$ crontab -e`
Go to the end, and add this line:
```bash
* * * * * kinit -t /etc/keytabs/$USER/cron.keytab $USER/cron@BX.PSU.EDU bash $HOME/code/monitor/smonitor.sh $HOME/public_html/monitor
```
Again, replace `$HOME` with the path to your AFS home directory, and `$USER` with your username. If your `cron.keytab` or `smonitor.sh` file aren't at those paths, change them.
