# cluster-monitor

Here's a system to make the current jobs, usage, resources, etc. of the slurm cluster viewable in a web browser.

## How it works

### Backend

The core is `smonitor.sh`, which uses commands like `squeue` and `sinfo` to print stats on cluster usage to a bunch of text files in my `public_html` directory. I run this every minute via a cron job. Then, anyone can just view the text files in a browser.

### Frontend

Because I wanted to try something fancy, and because I'd always get tricked by outdated status files when my smonitor scripts died, I wrote a small Javascript app that auto-updates the info from the server and warns you when it's outdated.

If you place the html files in the same `public_html` directory the `smonitor.sh` script writes to, then you can view, say, `jobs.html` in your browser and it'll periodically pull the `jobs.txt` output of `smonitor.sh`. It checks how old the text file is and displays the age to the user. There's a different html file for each of the status text files.

## Permissions issues

 The way the Kerberos authentication and the permissions of the `public_html` directory interact mean that your cron job probably won't be able to write directly to `public_html`. As a workaround, you can have it write to a directory elsewhere that it does have access to (like `/galaxy/home/$USER`). Then you can just launch `smonitor-cp.sh` in the background manually. This wakes up every minute and copies the `smonitor.sh` output to `public_html`.

The ideal solution is instead to get the Kerberos permissions worked out so your cron job can write directly to your `public_html`. Rico knows how to do this and I'm not sure about the details, but at least you can see the cron line I use:  
```
* * * * * /usr/bin/k5start -U -f /etc/keytabs/nick/cron.keytab -t -K 60 bash /galaxy/home/nick/code/smonitor.sh /afs/bx.psu.edu/user/n/nick/public_html/monitor
```
