#!/usr/bin/env bash
docker save maxflow | bzip2 | pv | ssh root@haucke.xyz 'bunzip2 | docker load'