## Collaborative signature scanning tool for IGB toolbox

### Features

* Allows sharing of scanned signatures across alliance or corp members
* Realtime update for all IGB clients
* Copy and paste of scan results from EVE client into IGB with automatic application update
* Classifies signatures based on type of site (e.g. Anomaly, RADAR, Wormhole,..)
* Further infos and links for many detected sites
* Presents added signatures by region and system
* Allows entering of wormhole details (type, destination, comments)
* Dedicated overview on scanned wormholes incl. destination
* Manual or automatic results cleanup

### Installation

You'll first have to install the base [IGB toolbox](https://github.com/igbtoolbox/igbtoolbox) server and development environment.

Afterwards you can simply install the application from the toolbox base directory (/vagrant in case of vagrant):

`bower install --save-dev git@github.com:igbtoolbox/evesignatures.git`

Add access permissions to your settings file (`/home/vagrant/.igbtoolbox.yml`). Example:

```yaml
access:
  host_alliance_id: <yourallianceid>

  modules:
    signatures:
      public: true
```

Read more [here](https://github.com/igbtoolbox/eveauthzsimple) about access control.

Re-run webpack:

`npm run build`

Now restart the server and you should find a new "Signatures" tab.
