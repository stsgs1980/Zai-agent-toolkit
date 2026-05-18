# RAG Pipeline Guide

## Overview

This document describes the RAG (Retrieval-Augmented Generation) pipeline
used in the ZCODE Memory System. RAG combines vector search with LLM generation
to provide contextually relevant answers from your knowledge base.

## Key Concepts

**Vector Embedding**: A numerical representation of text in high-dimensional space.
Embeddings capture semantic meaning, allowing similarity search across documents.

**ChromaDB**: An open-source vector database that stores embeddings and supports
efficient similarity search with metadata filtering.

**Chunking Strategy**: The method of splitting documents into smaller pieces
before embedding. Good chunking preserves context boundaries.

**Retrieval**: The process of finding the most relevant chunks from the vector
database given a user query.

**Augmented Generation**: Adding retrieved context to the LLM prompt so that
the model generates answers grounded in your actual data.

## How to Set Up RAG

1. Install ChromaDB and the memory CLI tools
2. Initialize the database with `python memory_cli.py init`
3. Store your first knowledge entry
4. Configure the embedding model in the settings

### Installation Steps

1. Clone the repository
2. Run the setup script
3. Verify installation with a test query

```bash
# Initialize the memory system
python memory_cli.py init

# Store a knowledge entry
python memory_cli.py store knowledge "RAG combines retrieval with generation"

# Query the system
python memory_cli.py query "What is RAG?"
```

## Configuration

### Embedding Model

The default embedding model is `all-MiniLM-L6-v2`. You can change it
in the config file.

```bash
# Set custom embedding model
export CHROMA_EMBEDDING_MODEL="all-mpnet-base-v2"
python memory_cli.py init
```

### Graph Settings

The graph engine uses NetworkX for relationship management.

```bash
# View graph statistics
python memory_cli.py graph stats

# Export graph for dashboard
python memory_cli.py graph export --output graph.json
```

## Troubleshooting

### Common Issues

**Embedding mismatch**: If queries return poor results, check that the
embedding model matches the one used during ingestion.

**Slow queries**: Large collections may need indexing. Use metadata filters
to narrow down search scope.

```bash
# Check collection stats
python memory_cli.py list knowledge

# Rebuild the index
python memory_cli.py init --rebuild
```

## Tags

#rag #chromadb #embedding #vector-search #llm #python #knowledge-base
