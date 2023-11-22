#!/bin/bash

# O primeiro argumento é a identidade, o segundo é a passphrase
IDENTITY=$1
PASSPHRASE=$2

# Chama dfx e fornece a passphrase
echo $PASSPHRASE | dfx identity new $IDENTITY