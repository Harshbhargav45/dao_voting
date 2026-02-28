/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/vote_app.json`.
 */
export type VoteApp = {
  "address": "HDrF2dTrJp5SEvDFy8YEk6E5vivj3DgaBNpUPebdGH9F",
  "metadata": {
    "name": "voteApp",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buyTokens",
      "discriminator": [
        189,
        21,
        230,
        133,
        247,
        2,
        110,
        42
      ],
      "accounts": [
        {
          "name": "treasuryConfigAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "solVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "xMint",
          "writable": true
        },
        {
          "name": "buyerTokenAccount",
          "writable": true
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "closeProposal",
      "discriminator": [
        213,
        178,
        139,
        19,
        50,
        191,
        82,
        245
      ],
      "accounts": [
        {
          "name": "proposalAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "proposalId"
              }
            ]
          }
        },
        {
          "name": "destination",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u8"
        }
      ]
    },
    {
      "name": "closeVoter",
      "discriminator": [
        117,
        35,
        234,
        247,
        206,
        131,
        182,
        149
      ],
      "accounts": [
        {
          "name": "voterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "configureTreasuryTokenAccount",
      "discriminator": [
        99,
        164,
        186,
        77,
        85,
        14,
        23,
        251
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasuryConfigAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "xMint"
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeProposalCounter",
      "discriminator": [
        154,
        184,
        230,
        123,
        59,
        242,
        14,
        209
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposalCounterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108,
                  95,
                  99,
                  111,
                  117,
                  110,
                  116,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeTreasury",
      "discriminator": [
        124,
        186,
        211,
        195,
        85,
        165,
        129,
        166
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "treasuryConfigAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "xMint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  120,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "solVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "solPrice",
          "type": "u64"
        },
        {
          "name": "tokensPerPurchase",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pickWinner",
      "discriminator": [
        227,
        62,
        25,
        73,
        132,
        106,
        68,
        96
      ],
      "accounts": [
        {
          "name": "winnerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  105,
                  110,
                  110,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "proposalAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "proposalId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u8"
        }
      ]
    },
    {
      "name": "proposalToVote",
      "discriminator": [
        16,
        158,
        25,
        40,
        209,
        104,
        71,
        196
      ],
      "accounts": [
        {
          "name": "voterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "xMint"
        },
        {
          "name": "voterTokenAccount",
          "writable": true
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "proposalAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "proposalId"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "proposalId",
          "type": "u8"
        },
        {
          "name": "tokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerProposal",
      "discriminator": [
        255,
        112,
        186,
        111,
        67,
        158,
        20,
        87
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposalAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "proposal_counter_account.proposal_count",
                "account": "proposalCounter"
              }
            ]
          }
        },
        {
          "name": "proposalCounterAccount",
          "writable": true
        },
        {
          "name": "xMint"
        },
        {
          "name": "proposalTokenAccount",
          "writable": true
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proposalInfo",
          "type": "string"
        },
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "tokenAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerVoter",
      "discriminator": [
        229,
        124,
        185,
        99,
        118,
        51,
        226,
        6
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "voterAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  111,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "withdrawSol",
      "discriminator": [
        145,
        131,
        74,
        136,
        65,
        137,
        42,
        38
      ],
      "accounts": [
        {
          "name": "treasuryConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "solVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "proposal",
      "discriminator": [
        26,
        94,
        189,
        187,
        116,
        136,
        53,
        33
      ]
    },
    {
      "name": "proposalCounter",
      "discriminator": [
        110,
        92,
        147,
        182,
        142,
        28,
        182,
        5
      ]
    },
    {
      "name": "treasuryConfig",
      "discriminator": [
        124,
        54,
        212,
        227,
        213,
        189,
        168,
        41
      ]
    },
    {
      "name": "voter",
      "discriminator": [
        241,
        93,
        35,
        191,
        254,
        147,
        17,
        202
      ]
    },
    {
      "name": "winner",
      "discriminator": [
        126,
        74,
        200,
        186,
        228,
        1,
        36,
        23
      ]
    }
  ],
  "events": [
    {
      "name": "proposalClosed",
      "discriminator": [
        57,
        90,
        47,
        164,
        105,
        55,
        97,
        27
      ]
    },
    {
      "name": "proposalCounterInitialized",
      "discriminator": [
        61,
        237,
        243,
        198,
        195,
        159,
        118,
        197
      ]
    },
    {
      "name": "proposalCreated",
      "discriminator": [
        186,
        8,
        160,
        108,
        81,
        13,
        51,
        206
      ]
    },
    {
      "name": "solWithdrawn",
      "discriminator": [
        145,
        249,
        69,
        48,
        206,
        86,
        91,
        66
      ]
    },
    {
      "name": "tokensPurchased",
      "discriminator": [
        214,
        119,
        105,
        186,
        114,
        205,
        228,
        181
      ]
    },
    {
      "name": "treasuryInitialized",
      "discriminator": [
        199,
        73,
        174,
        205,
        59,
        145,
        55,
        179
      ]
    },
    {
      "name": "voteCast",
      "discriminator": [
        39,
        53,
        195,
        104,
        188,
        17,
        225,
        213
      ]
    },
    {
      "name": "voterAccountClosed",
      "discriminator": [
        146,
        175,
        103,
        165,
        49,
        37,
        118,
        61
      ]
    },
    {
      "name": "voterRegistered",
      "discriminator": [
        184,
        179,
        209,
        46,
        125,
        60,
        51,
        197
      ]
    },
    {
      "name": "winnerDeclared",
      "discriminator": [
        58,
        14,
        239,
        225,
        166,
        50,
        207,
        70
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidDeadline",
      "msg": "Deadline must be a future timestamp"
    },
    {
      "code": 6001,
      "name": "proposalCounterAlreadyInitialized",
      "msg": "Proposal counter has already been initialized"
    },
    {
      "code": 6002,
      "name": "proposalCounterOverflow",
      "msg": "Maximum proposal limit reached"
    },
    {
      "code": 6003,
      "name": "proposalEnded",
      "msg": "Voting period has ended for this proposal"
    },
    {
      "code": 6004,
      "name": "proposalVotesOverflow",
      "msg": "Vote count overflow - maximum votes exceeded"
    },
    {
      "code": 6005,
      "name": "votingStillActive",
      "msg": "Cannot declare winner while voting is still active"
    },
    {
      "code": 6006,
      "name": "noVotesCast",
      "msg": "No votes have been cast for this proposal"
    },
    {
      "code": 6007,
      "name": "unauthorizedAccess",
      "msg": "You are not authorized to perform this action"
    },
    {
      "code": 6008,
      "name": "tokenMintMismatch",
      "msg": "Token mint does not match the expected mint"
    },
    {
      "code": 6009,
      "name": "voterAlreadyVoted",
      "msg": "Voter has already voted on this proposal"
    },
    {
      "code": 6010,
      "name": "invalidTokenAccountOwner",
      "msg": "Token account is not owned by the expected wallet"
    },
    {
      "code": 6011,
      "name": "invalidMint",
      "msg": "Provided mint account is invalid"
    }
  ],
  "types": [
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "u8"
          },
          {
            "name": "numberOfVotes",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "proposalInfo",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "proposalClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "u8"
          },
          {
            "name": "rentRecovered",
            "type": "u64"
          },
          {
            "name": "recoveredTo",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "proposalCounter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "proposalCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "proposalCounterInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "proposalCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "u8"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "proposalInfo",
            "type": "string"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "solWithdrawn",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tokensPurchased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "solPaid",
            "type": "u64"
          },
          {
            "name": "tokensReceived",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "treasuryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "xMint",
            "type": "pubkey"
          },
          {
            "name": "treasuryTokenAccount",
            "type": "pubkey"
          },
          {
            "name": "solPrice",
            "type": "u64"
          },
          {
            "name": "tokensPerPurchase",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "treasuryInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "xMint",
            "type": "pubkey"
          },
          {
            "name": "solPrice",
            "type": "u64"
          },
          {
            "name": "tokensPerPurchase",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voteCast",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "proposalId",
            "type": "u8"
          },
          {
            "name": "totalVotes",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voterId",
            "type": "pubkey"
          },
          {
            "name": "proposalVoted",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "voterAccountClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "rentRecoveredTo",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "voterRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "voterAccount",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "winner",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "winningProposalId",
            "type": "u8"
          },
          {
            "name": "winningVotes",
            "type": "u64"
          },
          {
            "name": "proposalInfo",
            "type": "string"
          },
          {
            "name": "declaredAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "winnerDeclared",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "winningProposalId",
            "type": "u8"
          },
          {
            "name": "proposalInfo",
            "type": "string"
          },
          {
            "name": "totalVotes",
            "type": "u64"
          },
          {
            "name": "declaredBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
