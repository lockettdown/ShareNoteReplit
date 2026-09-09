---
name: GitHub binary uploads
description: Reliable GitHub Git Data API uploads for large and binary workspace files.
---

When creating GitHub blobs through the Git Data API, read large files and binary assets directly from the filesystem inside the integration call and encode those bytes as base64. Do not route their base64 through captured shell output.

**Why:** Shell-captured base64 produced successful API responses but different Git blob hashes for larger files, so the remote tree did not match the local Git tree.

**How to apply:** Compare uploaded blob hashes with local `git hash-object` values, and compare the finished remote tree SHA with local `HEAD^{tree}` before considering an API-based push complete.

If an HTTPS Git remote has stale credentials but the GitHub integration still works, publish the changed tree through GitHub's Git Data API. GitHub-generated commits may not be reproducible locally from visible metadata, so fetch the new public branch with credential helpers disabled, then set the local branch and upstream to the fetched commit.

**Why:** Creating a matching tree is deterministic, but reconstructing the API-generated commit locally can produce a different commit hash even when the tree, parent, message, author, and timestamp appear identical.

**How to apply:** Verify the remote and local tree SHAs first. Then fetch with an explicit credential-free Git command when the repository is public; for a private repository, repair the GitHub connection rather than extracting or exposing credentials.