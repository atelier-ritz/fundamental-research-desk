import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {researchSummary} from '../src/research-summary.mjs';import {forecastContext} from '../src/forecast.mjs';import {selectBusinessProfile} from '../src/business.mjs';
const explicit=d=>({...forecastContext(d).starts,reinvest:.08,discount:.1,terminal:.025});
const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url))),msft=read('../src/snapshot.json'),profiles=read('../src/business-profiles.json');
test('summary reconciles annual performance, segment scope and evidence dates',()=>{
 const s=researchSummary(msft,selectBusinessProfile(msft,profiles),explicit(msft));
 assert.equal(s.cards.length,4);assert.match(s.cards[0].statements.join(' '),/17.8%/);assert.match(s.cards[1].statements.join(' '),/Productivity and Business Processes/);assert.ok(s.cards[0].evidence.every(f=>f.url.startsWith('https://www.sec.gov/Archives/')));assert.equal(s.annualEnd,'2026-06-30');assert.ok(s.sensitivity);assert.match(s.cards[3].statements.join(' '),/local tests, not probabilities/);
});
test('missing debt and business disclosures remain gaps; bank model is never valued',()=>{
 const d=read('./fixtures/jpm.json'),s=researchSummary(d,null,forecastContext(d).starts);assert.equal(s.sensitivity,null);assert.match(s.cards[1].statements.join(' '),/coverage gap/);assert.match(s.cards[2].statements.join(' '),/incomplete/);assert.match(s.cards[3].statements.join(' '),/specialist equity model/);
});
test('loss-making businesses retain losses and summary changes with scenario inputs',()=>{
 const d=read('./fixtures/rivn.json'),s=researchSummary(d,null,forecastContext(d).starts);assert.match(s.cards[0].statements.join(' '),/-/);assert.match(s.cards[3].statements.join(' '),/no automatic turnaround/);assert.equal(s.sensitivity,null);
 const inputs=explicit(msft),a=researchSummary(msft,null,inputs),b=researchSummary(msft,null,{...inputs,discount:.15});assert.notEqual(a.sensitivity.size,b.sensitivity.size);
});
