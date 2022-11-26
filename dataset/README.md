### Structure
- `samples`: used to keep separated samples for back-log purposes.
- `out`: the directory where the output is stored, contains the version file. (auto-created and auto-overriden, **DO NOT TOUCH unless for COPYING**)
- `words.txt`: the dataset to filter and prepare.

### Updating

To update the dataset, please follow the steps below:
- Make sure you are at the root of the project and run the command: `npm run filter`. (this should create a `version.json` and `words.txt`)
- Head to the `dataset/out` folder and **COPY** (DO NOT USE CUT) the `version.json` and `words.txt` to the `/static/dataset` folder (at the root of the project).
- And once the application is deployed, the new incoming clients should be automatically checking the version number and updating their dataset.