import os
import json

# Define paths
pdf_folder = r"C:\Users\Owner\Documents\jan-books-2026-pdfs"
source_folder = r"C:\Users\Owner\Documents\jan-books-2026"

# Get list of PDFs (without extension)
pdf_files = set()
for file in os.listdir(pdf_folder):
    if file.lower().endswith('.pdf'):
        # Remove .pdf extension
        pdf_files.add(file[:-4])

# Get list of source files (without extension)
source_files = {}
for file in os.listdir(source_folder):
    name, ext = os.path.splitext(file)
    source_files[name] = ext

# Find missing conversions
missing = []
for name, ext in source_files.items():
    if name not in pdf_files:
        missing.append(f"{name}{ext}")

print(f"Total PDFs: {len(pdf_files)}")
print(f"Total source files: {len(source_files)}")
print(f"Missing conversions: {len(missing)}")
if missing:
    print("\nFiles not converted to PDF:")
    for file in sorted(missing):
        print(f"  - {file}")

# Get first 3 PDFs for testing
test_pdfs = []
for file in sorted(os.listdir(pdf_folder))[:3]:
    if file.lower().endswith('.pdf'):
        test_pdfs.append(os.path.join(pdf_folder, file))

print(f"\nTest PDFs selected for Mendeley validation:")
for i, pdf_path in enumerate(test_pdfs, 1):
    print(f"  {i}. {os.path.basename(pdf_path)}")

# Save test PDF paths to a JSON file for later use
test_data = {
    "total_pdfs": len(pdf_files),
    "total_sources": len(source_files),
    "missing_conversions": missing,
    "test_pdfs": test_pdfs,
    "all_pdfs": [os.path.join(pdf_folder, f) for f in sorted(os.listdir(pdf_folder)) if f.lower().endswith('.pdf')]
}

output_file = r"C:\Users\Owner\.gemini\antigravity\scratch\mendeley_import_data.json"
os.makedirs(os.path.dirname(output_file), exist_ok=True)

with open(output_file, 'w') as f:
    json.dump(test_data, f, indent=2)

print(f"\nData saved to: {output_file}")
