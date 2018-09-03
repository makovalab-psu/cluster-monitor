# cluster-monitor

Here's a system to make the current jobs, usage, resources, etc. of the slurm cluster viewable in a web browser.

## How it works

### Backend

The core is `smonitor.sh`, which uses commands like `squeue` and `sinfo` to print stats on cluster usage to a bunch of text files in my `public_html` directory. I run this every minute via a cron job. Then, anyone can just view the text files in a browser.

### Frontend

Because I wanted to try something fancy, and because I'd always get tricked by outdated status files when my smonitor scripts died, I wrote a small Javascript app that auto-updates the info from the server and warns you when it's outdated.

If you place the html files in the same `public_html` directory the `smonitor.sh` script writes to, then you can view, say, `jobs.html` in your browser and it'll periodically pull the `jobs.txt` output of `smonitor.sh`. It checks how old the text file is and displays the age to the user. There's a different html file for each of the status text files.

## Setup

### Create a Kerberos keytab

We want to run `smonitor.sh` automatically from a cron job, but commands run from there don't have permission to alter the `public_html` directory. The solution is to create a "keytab" file, which contains Kerberos credentials to access that directory.

The following commands will create a file `cron.keytab` in `$HOME/cron` (but you can put it wherever you want).

You'll have to enter your BX password each time you run the command.

#TODO: figure out commands that actually work.
```bash
mkdir -p $HOME/cron
ktutil -k $HOME/cron/cron.keytab add -V 1 -p $USER/cron@BX.PSU.EDU -e arcfour-hmac-md5
ktutil -k $HOME/cron/cron.keytab add -V 2 -p $USER/cron@BX.PSU.EDU -e aes256-cts-hmac-sha1-96
ktutil -k $HOME/cron/cron.keytab add -V 4 -p $USER/cron@BX.PSU.EDU -e des-cbc-crc
```

### Set up the cron job

The cron job will run `smonitor.sh` every minute, printing the cluster status to text files in your `public_html` directory.

First, create a subdirectory in `public_html` for the files to live in:
`$ mkdir -p ~/public_html/monitor`

Then, run crontab to edit your cron jobs:
`$ crontab -e`
Go to the end, and add this line:
```
* * * * * kinit -t $HOME/cron/cron.keytab $USER/cron@BX.PSU.EDU bash $HOME/code/monitor/smonitor.sh $HOME/public_html/monitor
```
But replace `$HOME` with the path to your AFS home directory, and `$USER` with your username. If your `cron.keytab` or `smonitor.sh` file aren't at those paths, change them.

For example, this is the line in my crontab:
```
* * * * * kinit -t /etc/keytabs/nick/cron.keytab nick/cron@BX.PSU.EDU bash /galaxy/home/nick/code/smonitor.sh /afs/bx.psu.edu/user/n/nick/public_html/monitor
```

### Non-Kerberos alternative

If you can't get it to work with a Kerberos keytab, an alternative is to have the cron job write its files to some directory it does have permissions for, and run `smonitor-cp.sh` in the background, which will periodically copy the files to your `public_html`.

First, create a directory cron can write the files to. One that worked for me is my `/galaxy/home` directory:
`$ mkdir -p /galaxy/home/$USER/cron/monitor`

Then, use this crontab line instead of the one above:
```
* * * * * bash $HOME/code/monitor/smonitor.sh /galaxy/home/$USER/cron/monitor
```
Again, replace $HOME with your AFS home (or wherever the script is), and $USER with your username.

Then, while logged into an ssh session on desmond, launch `smonitor-cp.sh` in the background. Use `nohup` to protect it from dying when you log out or if the ssh session dies:
`nohup ~/code/smonitor-cp.sh /galaxy/home/$USER/cron/monitor ~/public_html/monitor 10 >/dev/null 2>/dev/null &`

This should keep running for about a week or so, until the Kerberos ticket for your ssh session expires. Then, you'll have to re-launch `smonitor-cp.sh`.
