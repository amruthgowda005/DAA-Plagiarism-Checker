# Plagiarism Checker Using Divide and Conquer Method
**Design and Analysis of Algorithms (DAA) Course Project**

## 1. Abstract
This project implements a high-performance Plagiarism Checker built upon the **Divide and Conquer** algorithmic paradigm. Instead of comparing whole documents sequentially (which can be inefficient for large texts), the system recursively divides documents into smaller subsets (chunks) of text, compares the leaves concurrently, and combines the similarities to compute an overall plagiarism percentage. It features a complete Full-Stack web architecture using **React.js, Node.js, Express, and SQLite**.

## 2. Introduction
Plagiarism detection is a fundamental problem in text processing. Traditional brute-force string matching methods operate in `O(N*M)` time. By leveraging the Divide and Conquer approach along with Jaccard Similarity for chunk comparison, this system efficiently isolates matched portions of documents, offering theoretical improvements in practical distributed scenarios, as well as providing deep complexity analysis metrics to the end user.

## 3. Problem Statement
Given two text-heavy documents (PDF, DOCX, TXT), accurately determine the similarity score and highlight exact matched chunks. The solution must execute optimally by recursively splitting the problem space, adhering strictly to the **Divide and Conquer** paradigm.

## 4. Objectives
- Implement a recursive Divide and Conquer algorithm for text similarity.
- Extract and preprocess text accurately from various file formats.
- Build a full-stack dashboard to manage and compare documents.
- Provide real-time algorithmic insights: Time Complexity, Recursive Calls, Tree Depth.

## 5. System Architecture
The system follows a classic Client-Server Architecture:
- **Frontend**: React.js, Tailwind CSS, Recharts (for visualization), React Router.
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (local `plagiarism_checker.db`).
- **Authentication**: JWT & bcrypt.
- **File Parsers**: `pdf-parse` (PDF), `mammoth` (DOCX).

## 6. Algorithm Design: Divide and Conquer
The core algorithm is situated in `backend/algorithms/divideAndConquer.js`.

**1. DIVIDE Phase:**
The preprocessed token arrays of both documents are recursively split into two halves: `left` and `right`.
```js
midA = lengthA / 2; leftA = docA(0...midA); rightA = docA(midA...end)
```
The splitting continues until the chunk size reaches the base case (`CHUNK_SIZE <= 100` words).

**2. CONQUER Phase:**
At the leaf nodes, the chunks are small enough to be compared using **Jaccard Similarity**:
```js
J(A,B) = |A ∩ B| / |A ∪ B|
```

**3. COMBINE Phase:**
The similarities returned from the left and right recursive branches are merged using a weighted average based on their respective sizes, bubbling the total similarity score up to the root node.

## 7. Complexity Analysis
The backend calculates the exact Time and Space complexities dynamically based on input sizes.

- **Recurrence Relation**: `T(n) = 2T(n/2) + O(n)`
- **Best Case Time Complexity**: `O(n log n)` (Early termination paths or low similarity).
- **Average Case Time Complexity**: `O(n log n)` (Master Theorem Case 2).
- **Worst Case Time Complexity**: `O(n²)` (Highly identical documents requiring exhaustive leaf comparison).
- **Space Complexity**: `O(n log n)` due to recursive call stack `O(log n)` + array chunk allocation.

## 8. Database Design
**SQLite Tables:**
1. **users**: id, username, email, password, full_name.
2. **documents**: id, user_id, filename, original_name, file_type, extracted_text.
3. **reports**: id, user_id, doc1_id, doc2_id, similarity_score, plagiarism_percent, algorithm_data (JSON).

## 9. Running the Application

### Setup Environment
Ensure Node.js (v16+) is installed.

### Backend Setup
```bash
cd project/backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Frontend Setup
```bash
cd project/frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## 10. Conclusion
This project successfully demonstrates the practical application of the Divide and Conquer paradigm within a modern, full-stack web application. The recursive approach significantly aids in parallelizing chunk analysis and explicitly identifying localized plagiarism boundaries.

## 11. Future Scope
- Implementation of multi-threading (Worker Threads in Node.js) to parallelize the Divide branches.
- Substitution of Jaccard Similarity with NLP-based semantic similarity (Cosine Similarity with TF-IDF/Word2Vec).
- Cloud deployment and scaling.
