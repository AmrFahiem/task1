"use strict";

let blindSignatures = require('blind-signatures');
let SpyAgency = require('./spyAgency.js').SpyAgency;

function makeDocument(coverName) {
  return `The bearer of this signed document, ${coverName}, has full diplomatic immunity.`;
}

function blind(msg, n, e) {
  return blindSignatures.blind({
    message: msg,
    N: n,
    E: e,
  });
}

function unblind(blindingFactor, sig, n) {
  return blindSignatures.unblind({
    signed: sig,
    N: n,
    r: blindingFactor,
  });
}

let agency = new SpyAgency();

// Step 1: Prepare 10 documents with different cover identities
let coverNames = ["Agent X", "Agent Y", "Agent Z", "Agent A", "Agent B", "Agent C", "Agent D", "Agent E", "Agent F", "Agent G"];
let documents = coverNames.map(makeDocument);

// Step 2: Blind each document and store their blinding factors
let blindDocs = [];
let blindingFactors = [];

documents.forEach(doc => {
  let { blinded, r } = blind(doc, agency.n, agency.e);
  blindDocs.push(blinded);
  blindingFactors.push(r);
});

// Step 3: Send blinded documents to the agency for signing
agency.signDocument(blindDocs, (selected, verifyAndSign) => {
  let blindedFactorsForVerification = blindingFactors.map((r, index) => index === selected ? undefined : r);
  let originalDocsForVerification = documents.map((doc, index) => index === selected ? undefined : doc);

  // Get the blinded signature from the agency
  let blindedSignature = verifyAndSign(blindedFactorsForVerification, originalDocsForVerification);

  // Unblind the signature
  let unblindedSignature = unblind(blindingFactors[selected], blindedSignature, agency.n);

  // Verify the signature
  let isValid = blindSignatures.verify({
    unblinded: unblindedSignature,
    N: agency.n,
    E: agency.e,
    message: documents[selected],
  });

  console.log(`Signature verification for '${coverNames[selected]}':`, isValid ? "Valid" : "Invalid");
});
