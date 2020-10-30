# GitHub Action: Get Changed Dirs
Saves lists of changed directories in the `outputs` object and on the filesystem for use by other actions.

### Workflow Config Example
```
- uses: rodrigodealer/last-changed-dir@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    forbidden: '[]'
```

### Inputs
* **`token`**: The `GITHUB_TOKEN` secret

* **`forbidden`**: A list of directories that can be filtered from the output. If any changes in these directories occur, they would not appear.

### Outputs
All output values are a single JSON encoded array.

* **`all`**: Added, deleted, renamed and modified directories

### The following files will be created by this action

* `${HOME}/dirs.json`
