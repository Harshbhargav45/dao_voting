#!/bin/bash
rm -f Cargo.lock
cargo update
anchor build
