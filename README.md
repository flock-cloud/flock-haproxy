flock-haproxy
=============

Generates a new configuration file for HAProxy from the specified Marathon
servers, replaces the file in /etc/haproxy/haproxy.cfg and restarts the service.

This process is run every minute as a cron script. It should be replaced
by a component that subscribes to Marathon. This way it would get callbacks
and reconfigure haproxy in real time.
