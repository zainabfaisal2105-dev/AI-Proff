export interface SampleDocument {
  id: string;
  title: string;
  fileType: 'pdf' | 'xlsx' | 'txt';
  category: string;
  description: string;
  content: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'clinical-trial',
    title: 'Phase III Multicenter Clinical Trial: BDX-409 in Moderate-to-Severe Refractory Asthma',
    fileType: 'pdf',
    category: 'Medical Research & Clinical Trial',
    description: '1,420 randomized participants, exact 78.4% primary endpoint response, adverse event rates, and biomarker subgroups.',
    content: `[Page 1: Study Overview and Participant Demographics]
Title: Phase III Multicenter, Double-Blind, Randomized Controlled Evaluation of BDX-409 in Adults with Severe Uncontrolled Eosinophilic Asthma.
Principal Investigator: Dr. Marianne Vance, MD, PhD, Thoracic Therapeutics Consortium.
Study Duration: 52 weeks (screening weeks -4 to 0; treatment period weeks 1 to 48; safety follow-up weeks 49 to 52).

A total of 1,420 adult patients aged 18 to 75 years were enrolled across 84 clinical trial centers in 14 countries. 
Inclusion criteria required: (1) baseline blood eosinophil count >= 300 cells/uL, (2) at least 2 documented severe asthma exacerbations within the preceding 12 months requiring systemic corticosteroids, and (3) pre-bronchodilator FEV1 <= 65% of predicted normal value. 
Patients were randomized 1:1:1 to receive either:
- Group A: BDX-409 150 mg subcutaneous injection every 4 weeks (n = 473)
- Group B: BDX-409 300 mg subcutaneous injection every 4 weeks (n = 474)
- Group C: Matched placebo subcutaneous injection every 4 weeks (n = 473)

Baseline mean age was 48.6 years; 58.2% of participants were female. Mean baseline FEV1 was 1.62 L (54.1% of predicted). Median baseline blood eosinophil count was 440 cells/uL. All participants maintained their background high-dose inhaled corticosteroids (ICS) plus long-acting beta-agonists (LABA) throughout the 52-week period.

[Page 2: Primary and Secondary Efficacy Endpoints]
Primary Endpoint:
The primary efficacy outcome was the annualized asthma exacerbation rate (AAER) at Week 48 compared to placebo.
- Group A (150 mg): AAER of 0.42 exacerbations/patient-year (a 64.2% relative reduction vs. placebo, 95% CI [54.8%, 71.9%], p < 0.001).
- Group B (300 mg): AAER of 0.28 exacerbations/patient-year (a 78.4% relative reduction vs. placebo, 95% CI [70.1%, 84.5%], p < 0.0001).
- Group C (Placebo): AAER of 1.30 exacerbations/patient-year.

Secondary Endpoints:
1. Change from baseline in pre-bronchodilator FEV1 at Week 24:
   - Group A demonstrated a mean improvement of +240 mL (p < 0.001 vs placebo).
   - Group B demonstrated a mean improvement of +315 mL (p < 0.0001 vs placebo).
   - Group C (Placebo) showed a mean improvement of +45 mL.
2. Asthma Quality of Life Questionnaire (AQLQ) score improvement >= 0.5 points (minimal clinically important difference):
   - Group A: 68.4% of patients achieved MCID at Week 48.
   - Group B: 82.1% of patients achieved MCID at Week 48.
   - Group C: 41.3% of patients achieved MCID at Week 48.
3. Oral Corticosteroid (OCS) Reduction: Among the subset of 312 patients receiving maintenance oral prednisone (mean baseline dose 14.5 mg/day), 61.2% in Group B eliminated maintenance OCS completely by Week 48, compared to 18.3% in Group C (placebo).

[Page 3: Safety Profile, Adverse Events, and Tolerability]
Overall incidence of treatment-emergent adverse events (TEAEs) was 74.2% in Group A, 76.8% in Group B, and 72.9% in Group C.
Most common adverse events:
- Nasopharyngitis: 14.2% (Group A), 15.6% (Group B), 13.8% (Placebo).
- Injection-site reactions (erythema, localized swelling): 8.9% (Group A), 11.2% (Group B), 2.7% (Placebo). Reactions were predominantly mild and resolved within 48 hours without intervention.
- Headache: 7.4% (Group A), 8.1% (Group B), 6.9% (Placebo).

Serious Adverse Events (SAEs):
- Group A: 19 patients (4.0%) experienced SAEs.
- Group B: 18 patients (3.8%) experienced SAEs.
- Group C (Placebo): 29 patients (6.1%) experienced SAEs (predominantly asthma-related hospitalizations).
Discontinuation of study drug due to adverse events occurred in 1.9% of Group A, 2.3% of Group B, and 3.4% of Group C.
No cases of anaphylaxis, drug-induced liver injury, or helminthic infections were observed during the trial. Anti-drug antibodies (ADAs) were detected in 3.2% of BDX-409-treated participants at Week 48; neutralizing antibodies were confirmed in only 0.4%, with no observed loss of clinical efficacy.

[Page 4: Discussion, Subgroup Analysis, and Clinical Conclusions]
Subgroup Analysis:
- Patients with baseline blood eosinophils >= 500 cells/uL achieved the greatest magnitude of exacerbation reduction (83.2% reduction in Group B vs. placebo, p < 0.0001).
- Patients with concomitant nasal polyposis (n = 418) experienced a 4.2-point improvement in the Sino-Nasal Outcome Test (SNOT-22) at Week 48.
- Smokers or former smokers (< 10 pack-years, n = 188) demonstrated comparable efficacy to never-smokers (74.1% exacerbation reduction in Group B).

Contradictions & Limitations:
- An unexpected plateau in nocturnal symptom score improvement was observed between Week 36 and Week 48 in Group A, while daytime scores continued to improve; the biological mechanism for this nocturnal divergence remains unexplained.
- The trial protocol excluded pediatric populations under 18 years and patients with chronic obstructive pulmonary disease (COPD) overlap syndrome; findings cannot be generalized to these cohorts.

Final Conclusion:
BDX-409 administered at 300 mg subcutaneously every 4 weeks provided statistically significant and clinically meaningful reductions in annualized asthma exacerbations (78.4% reduction), substantial lung function enhancement (+315 mL FEV1), and a favorable benefit-risk profile in patients with severe eosinophilic asthma.`
  },
  {
    id: 'attention-paper',
    title: 'Attention Is All You Need (Vaswani et al.)',
    fileType: 'pdf',
    category: 'Computer Science & Deep Learning',
    description: 'Transformer architecture, Multi-Head Attention, 28.4 BLEU on WMT 2014 English-to-German, 8 attention heads, and positional encoding.',
    content: `[Section 1: Abstract & Introduction]
Title: Attention Is All You Need.
Authors: Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin.

Abstract:
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2.0 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature.

Introduction:
Recurrent neural networks, particularly long short-term memory (LSTM) and gated recurrent (GRU) neural networks, have been firmly established as state of the art approaches in sequence modeling. However, the inherently sequential nature of recurrent models precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples. Attention mechanisms have become an integral part of compelling sequence modeling, allowing modeling of dependencies without regard to their distance in the input or output sequences. In this work we propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output.

[Section 2: Model Architecture & Attention Mechanism]
The Transformer follows an encoder-decoder structure using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder.

Encoder:
The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection around each of the two sub-layers, followed by layer normalization. That is, the output of each sub-layer is LayerNorm(x + Sublayer(x)), where Sublayer(x) is the function implemented by the sub-layer itself. To facilitate these residual connections, all sub-layers in the model, as well as the embedding layers, produce outputs of dimension d_model = 512.

Decoder:
The decoder is also composed of a stack of N = 6 identical layers. In addition to the two sub-layers in each encoder layer, the decoder inserts a third sub-layer, which performs multi-head attention over the output of the encoder stack. Similar to the encoder, we employ residual connections around each of the sub-layers, followed by layer normalization. We also modify the self-attention sub-layer in the decoder stack to prevent positions from attending to subsequent positions. This masking, combined with the fact that the output embeddings are offset by one position, ensures that the predictions for position i can depend only on the known outputs at positions less than i.

Scaled Dot-Product Attention:
We compute the attention function on a set of queries simultaneously, packed together into a matrix Q. The keys and values are also packed into matrices K and V. We compute the matrix of outputs as:
Attention(Q, K, V) = softmax(Q * K^T / sqrt(d_k)) * V
where queries and keys have dimension d_k, and values have dimension d_v. We divide by sqrt(d_k) to counteract the effect of dot products growing large in magnitude for large values of d_k, which pushes the softmax function into regions with extremely small gradients.

Multi-Head Attention:
Instead of performing a single attention function with d_model-dimensional keys, values, and queries, we found it beneficial to linearly project the queries, keys, and values h times with different, learned linear projections to d_k, d_k, and d_v dimensions, respectively.
In this work we employ h = 8 parallel attention layers, or heads. For each of these we use d_k = d_v = d_model / h = 512 / 8 = 64. Due to the reduced dimension of each head, the total computational cost is similar to that of single-head attention with full dimensionality. Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.

[Section 3: Positional Encoding & Computational Complexity]
Positional Encoding:
Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence. To this end, we add 'positional encodings' to the input embeddings at the bottoms of the encoder and decoder stacks. The positional encodings have the same dimension d_model as the embeddings, so that the two can be summed.
In this work, we use sine and cosine functions of different frequencies:
PE(pos, 2i) = sin(pos / 10000^(2i / d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i / d_model))
where pos is the position and i is the dimension. We also experimented with using learned positional embeddings instead, and found that the two versions produced nearly identical results. We chose the sinusoidal version because it may allow the model to extrapolate to sequence lengths longer than the ones encountered during training.

Computational Complexity Comparison:
Table 1 compares self-attention layers to recurrent and convolutional layers:
- Self-Attention: Complexity per layer is O(n^2 * d), Sequential operations is O(1), Maximum path length is O(1).
- Recurrent: Complexity per layer is O(n * d^2), Sequential operations is O(n), Maximum path length is O(n).
- Convolutional: Complexity per layer is O(k * n * d^2), Sequential operations is O(1), Maximum path length is O(log_k(n)).
When sequence length n is smaller than representation dimensionality d, self-attention layers are faster than recurrent layers.

[Section 4: Training Setup, Experimental Results, and Stated Limitations]
Training Hardware and Schedule:
We trained our models on one machine with 8 NVIDIA P100 GPUs. For our base models using the hyperparameters described throughout the paper, each training step took about 0.4 seconds. We trained the base models for a total of 100,000 steps or 12 hours. For our big models (described in Table 3: d_model = 1024, d_ff = 4096, h = 16, P_drop = 0.3), step time was 1.0 second. The big models were trained for 300,000 steps (3.5 days).
Optimizer: Adam optimizer with beta_1 = 0.9, beta_2 = 0.98, and epsilon = 10^-9.
Learning rate schedule: lrate = d_model^(-0.5) * min(step_num^(-0.5), step_num * warmup_steps^(-1.5)), with warmup_steps = 4000.
Regularization: Residual dropout with P_drop = 0.1 for base models; label smoothing with epsilon_ls = 0.1.

Results:
On the WMT 2014 English-to-German translation task, the big Transformer model outperforms the best previously reported models (including ensembles) by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4. Even our base model surpasses all previously published models and ensembles at a fraction of the training cost.
On the WMT 2014 English-to-French translation task, our big model achieves a BLEU score of 41.8, outperforming all previously published single models at 1/4 the training cost of the previous state-of-the-art model.

Limitations & Unspecified Rationale Stated in Text:
- While the paper demonstrates empirical gains with h = 8 heads, the text does not state an explicit theoretical proof or why h = 8 was specifically chosen over other configurations beyond empirical hyperparameter validation in Table 3.
- The authors explicitly limit the current paper to sequence transduction and plan future work to extend the Transformer to problems involving other modalities such as images, audio, and video.`
  },
  {
    id: 'financial-report',
    title: 'Q3 Enterprise Financial & Operating Performance Report',
    fileType: 'xlsx',
    category: 'Corporate Finance & Quarterly Earnings',
    description: 'GAAP revenue of $418.5M, 28.4% YoY growth, cloud margins, geographic segment breakdowns, and balance sheet metrics.',
    content: `[Sheet "Executive Summary", rows 1-20]
Consolidated Financial Highlights for Third Quarter Ended September 30:
- Total GAAP Revenue: $418.5 million, representing 28.4% year-over-year expansion (compared to $325.9 million in Q3 prior fiscal year).
- Cloud Subscription Revenue: $342.1 million (81.7% of total revenue), up 34.6% YoY.
- Professional Services & Advisory: $76.4 million (18.3% of total revenue), up 6.5% YoY.
- GAAP Gross Margin: 73.8% (expansion of 180 basis points from 72.0% in Q3 prior year).
- Non-GAAP Gross Margin: 76.2% (reflecting exclusion of $10.1M in stock-based compensation).
- Operating Income (GAAP): $52.4 million (operating margin of 12.5%, compared to $28.3 million or 8.7% in Q3 prior year).
- Non-GAAP Operating Income: $78.6 million (operating margin of 18.8%).
- Operating Cash Flow: $94.2 million (free cash flow: $81.7 million, representing 19.5% FCF margin).
- Total Cash, Cash Equivalents, and Marketable Securities: $1,248.5 million as of September 30, with zero long-term funded debt.

[Sheet "Segment Breakdown", rows 21-45]
Geographic Segment Performance:
- North America: Revenue of $255.3 million (61.0% of total revenue), grew 26.2% YoY.
- EMEA (Europe, Middle East, Africa): Revenue of $108.8 million (26.0% of total revenue), grew 31.8% YoY.
- Asia-Pacific (APAC): Revenue of $54.4 million (13.0% of total revenue), grew 33.1% YoY.

Customer & Enterprise Retention Metrics:
- Total Active Enterprise Customers (> $100K ARR): 1,842 accounts, up from 1,489 in Q3 prior year (+23.7% YoY).
- Million-Dollar Customers (> $1M ARR): 128 accounts, up from 94 accounts in Q3 prior year (+36.2% YoY).
- Dollar-Based Net Retention Rate (DBNRR): 122.5% for the trailing 12 months (compared to 121.0% in Q2 and 124.0% in Q3 prior year).
- Customer Acquisition Cost (CAC) Payback Period: 14.2 months (improved from 16.1 months in Q3 prior year).

[Sheet "Operating Expenses", rows 46-70]
Detailed Operating Expenditures (GAAP):
- Research & Development (R&D): $128.4 million (30.7% of revenue), focused on platform generative orchestration and low-latency vector databases.
- Sales & Marketing (S&M): $174.6 million (41.7% of revenue), down as a percentage of revenue from 44.5% in prior year due to partner referral efficiencies.
- General & Administrative (G&A): $63.1 million (15.1% of revenue), including $4.2M in legal and compliance costs for European AI governance.
- Headcount: Total global full-time employees reached 4,210 at quarter end, compared to 3,740 in Q3 prior year (+12.6% net additions).

[Sheet "Guidance & Forward Outlook", rows 71-85]
Full-Year Revised Guidance:
- Full-Year Revenue: Raised to range of $1,650 million - $1,665 million (representing 27.5% - 28.5% YoY growth).
- Full-Year Non-GAAP Operating Margin: Projected at 17.5% - 18.0%.
- CapEx Forecast: Expected between $45.0 million and $50.0 million for data center interconnects and hardware infrastructure.
- Risk Factors Stated in Filing: Foreign exchange headwinds (specifically Euro and Yen volatility) impacted Q3 reported revenue negatively by approximately $6.8 million.`
  },
  {
    id: 'tech-spec',
    title: 'Technical Specification: Paxos Quorum Consensus & Distributed State Machine Protocol',
    fileType: 'txt',
    category: 'Computer Science & Distributed Systems',
    description: 'Leader election, two-phase commit, Byzantine fault invariants, 2F+1 node quorum requirements, and log compaction.',
    content: `[Section 1: Protocol Architecture and Fault Model]
Document: Distributed Consensus Engine Specification (v4.2-STABLE).
System Model:
The system operates over an asynchronous distributed network with crash-recovery failure semantics. Nodes communicate via point-to-point message passing over TCP/IP channels. Network delays and message re-orderings are arbitrary, but messages are protected by 64-bit CRC checksums, eliminating message corruption (non-Byzantine environment).

Failure Bounds and Cluster Sizing:
For a cluster designed to tolerate up to F concurrent node crashes or network disconnections without service interruption, the cluster must comprise a total of N = 2F + 1 physical nodes.
A valid quorum Q is defined as any subset containing at least F + 1 nodes.
Under this mathematical formulation:
- An F = 1 cluster requires 3 nodes; quorum size is 2 nodes.
- An F = 2 cluster requires 5 nodes; quorum size is 3 nodes.
- Any two distinct quorums Q1 and Q2 intersect by at least one node: |Q1 ∩ Q2| >= 1. This quorum intersection property guarantees that at least one node in any newly formed quorum possesses the most recently accepted consensus proposal.

[Section 2: Two-Phase Consensus Mechanism]
The protocol operates in discrete proposal rounds identified by monotonically increasing tuple: Ballot Number = (round_number, node_id).

Phase 1a (Prepare):
A Proposer node selecting ballot number b broadcasts a Prepare(b) message to all Acceptor nodes in the cluster.
Phase 1b (Promise):
Upon receiving Prepare(b), an Acceptor compares b to the highest ballot b_max it has previously observed:
- If b > b_max, the Acceptor sets b_max = b and responds with a Promise(b, max_accepted_ballot, max_accepted_value). The Acceptor pledges never to accept any future proposals numbered less than b.
- If b <= b_max, the Acceptor rejects the message or returns a Nack(b_max).

Phase 2a (Accept):
If the Proposer receives Promise messages from a quorum of Acceptors (>= F + 1), it selects a value v:
- If any Acceptor reported a previously accepted value in its Promise, the Proposer MUST select the value associated with the highest ballot number among all responses.
- If no Acceptor reported a previously accepted value, the Proposer is free to propose its own client-submitted value v_client.
The Proposer then broadcasts Accept(b, v) to the Acceptor quorum.
Phase 2b (Accepted):
An Acceptor accepts (b, v) if and only if it has not promised to ignore ballot b (i.e., b >= b_max). Upon acceptance, it registers the slot and notifies the Proposer and all Learners via Accepted(b, v).

[Section 3: Log Replication, Commit Invariants, and State Machine Application]
Safety Invariants:
1. Nontriviality: Only a value proposed by a client may be committed.
2. Agreement: No two distinct state machines running on separate replicas can apply different log entries at the same index slot.
3. Monotonic Commit Index: The commitIndex variable maintained on each replica is strictly non-decreasing.

Log Compaction via Incremental Snapshots:
To prevent unbounded log expansion on disk, nodes execute asynchronous checkpointing every 50,000 committed entries.
- A snapshot contains: (1) the latest applied index slot, (2) the corresponding ballot number, (3) the complete serialized state of the application key-value store, and (4) the current cluster membership configuration.
- Once a snapshot is flushed to persistent NVMe storage, log entries prior to the snapshot index are safely truncated.

[Section 4: Split-Brain Prevention and Network Partitions]
Network Partition Behavior:
In the event of a network split dividing a 5-node cluster into a 3-node partition and a 2-node partition:
- The majority partition (3 nodes >= quorum size 3) maintains full read-write availability.
- The minority partition (2 nodes < quorum size 3) cannot achieve quorum on Phase 1b or Phase 2b. Consequently, write operations sent to the minority partition are queued or rejected with a STATUS_NO_QUORUM error.
- Split-brain states (simultaneous conflicting writes committed in both partitions) are mathematically precluded because the minority partition cannot assemble F + 1 votes.`
  }
];
