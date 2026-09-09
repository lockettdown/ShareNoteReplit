---
name: GitHub binary uploads
description: Reliable GitHub Git Data API uploads for large and binary workspace files.
---

When creating GitHub blobs through the Git Data API, read large files and binary assets directly from the filesystem inside the integration call and encode those bytes as base64. Do not route their base64 through captured shell output.

**Why:** Shell-captured base64 produced successful API responses but different Git blob hashes for larger files, so the remote tree did not match the local Git tree.

**How to apply:** Compare uploaded blob hashes with local `git hash-object` values, and compare the finished remote tree SHA with local `HEAD^{tree}` before considering an API-based push complete.