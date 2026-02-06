document.getElementById("download-pptx").addEventListener("click", () => {
    let pres = new PptxGenJS();

    // 1. Title Slide
    let slide = pres.addSlide();
    slide.addText("Beyond Observable Behavior: Measuring and Modifying the Function of Thought in School-Based Assessment", { x: 0.5, y: 1, w: 9, h: 1.5, fontSize: 32, bold: true, align: "center", color: "363636" });
    slide.addText("Integrating ACT & Functional Analysis in Public Schools", { x: 0.5, y: 2.5, w: 9, h: 0.5, fontSize: 18, align: "center", color: "666666" });
    slide.addText("Rob Spain, BCBA | Cristal Lopez, BCaBA | Megan Caluza, BCBA", { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 14, align: "center" });
    slide.addText("KCUSD Behavior Team | March 7, 2026", { x: 0.5, y: 4, w: 9, h: 0.5, fontSize: 14, align: "center" });

    // 2. The Problem
    slide = pres.addSlide();
    slide.addText("The Gap in Traditional FBA", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "Traditional FBAs focus on observable antecedents/consequences.", options: { bullet: true } },
        { text: "Misses severe behaviors driven by private events (rigid thoughts, experiential avoidance).", options: { bullet: true } },
        { text: "Internal triggers: \"I'm stupid,\" \"It's too hard.\"", options: { bullet: true } },
        { text: "Standard FBA misses the \"function of thought.\"", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 18 }
    );
    slide.addText("[PLACEHOLDER: Iceberg Graphic - Top: Aggression, Bottom: Private Thoughts]", { x: 0.5, y: 4.5, w: 9, h: 0.5, fontSize: 12, italic: true, color: "999999", align: "center" });

    // 3. Our Solution
    slide = pres.addSlide();
    slide.addText("A Dual-Lens Approach", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText("Wrapping ACT within a Functional Assessment framework", { x: 0.5, y: 1.2, w: 9, h: 0.5, fontSize: 18, italic: true, color: "666666" });
    slide.addText(
      [
        { text: "Latency-Based Precursor Analysis: Identifying the thought before the behavior.", options: { bullet: true } },
        { text: "ACT-Informed BIPs: Writing \"psychological flexibility\" into the IEP.", options: { bullet: true } },
        { text: "Staff Training: Teaching paras to coach defusion.", options: { bullet: true } },
        { text: "Data: Measuring physiological flexibility (CPFQ) & academic tolerance.", options: { bullet: true } }
      ],
      { x: 0.5, y: 2, w: 9, h: 3, fontSize: 18 }
    );

    // Section Divider: Assessment
    slide = pres.addSlide();
    slide.background = { color: "F1F5F9" };
    slide.addText("Part 1: The Assessment Phase", { x: 0.5, y: 2, w: 9, h: 1, fontSize: 32, bold: true, align: "center", color: "363636" });
    slide.addText("Identifying Internal Drivers of Behavior (Rob Spain)", { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 18, align: "center", color: "666666" });

    // 4. Moving Beyond A-B-C
    slide = pres.addSlide();
    slide.addText("Identifying Internal Drivers", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "Transitioning from Standard FBA → ACT-Informed Assessment.", options: { bullet: true } },
        { text: "Method: Latency-Based Precursor Analysis.", options: { bullet: true } },
        { text: "Goal: Identify \"early indicators\" of cognitive inflexibility before the explosion.", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 18 }
    );

    // 5. The Protocol
    slide = pres.addSlide();
    slide.addText("Safe Assessment in Schools", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "Step 1: Environmental Assessment (Standard FBA).", options: { bullet: true } },
        { text: "Step 2: Clinical Measures (CPFQ).", options: { bullet: true } },
        { text: "Step 3: The \"Test\" Conditions (Latency Measure).", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 18 }
    );
    slide.addText("We measure time to the first sign of avoidance (e.g., \"This is dumb\") and stop.", { x: 0.5, y: 4, w: 9, h: 1, fontSize: 14, italic: true, color: "666666" });

    // Section Divider: Intervention (Cristal)
    slide = pres.addSlide();
    slide.background = { color: "F1F5F9" };
    slide.addText("Part 2: The Intervention Phase", { x: 0.5, y: 2, w: 9, h: 1, fontSize: 32, bold: true, align: "center", color: "363636" });
    slide.addText("Values-Based Programming (Cristal Lopez)", { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 18, align: "center", color: "666666" });

    // 7. From Assessment to Action
    slide = pres.addSlide();
    slide.addText("Writing ACT into the IEP", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "Challenge: Making \"acceptance\" measurable and legally defensible.", options: { bullet: true } },
        { text: "Solution: Adapting the standard BIP template.", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 18 }
    );
    slide.addText("[PLACEHOLDER: Image of BIP Template with ACT columns]", { x: 0.5, y: 4, w: 9, h: 0.5, fontSize: 12, italic: true, color: "999999", align: "center" });

    // 8. Values-Based Goals
    slide = pres.addSlide();
    slide.addText("Replacements > Reductions", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "Old Goal: \"Reduce refusal to 0.\"", options: { bullet: true } },
        { text: "New Goal: \"When frustrated (antecedent), Student uses defusion strategy (behavior) to complete work (value).\"", options: { bullet: true } },
        { text: "Key: Tying behavior to what matters to the student.", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 18 }
    );

    // 9. Curricula & Strategies
    slide = pres.addSlide();
    slide.addText("Teaching the Skills", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "Tools: DNA-V, Defusion Curricula.", options: { bullet: true } },
        { text: "Adaptive Design: Visuals for non-readers, metaphors (Bus Driver).", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 18 }
    );
    slide.addText("[PLACEHOLDER: Insert visual aid example here]", { x: 0.5, y: 4, w: 9, h: 0.5, fontSize: 12, italic: true, color: "999999", align: "center" });

    // Section Divider: Implementation (Megan)
    slide = pres.addSlide();
    slide.background = { color: "F1F5F9" };
    slide.addText("Part 3: Implementation & Fidelity", { x: 0.5, y: 2, w: 9, h: 1, fontSize: 32, bold: true, align: "center", color: "363636" });
    slide.addText("Systems of Support (Megan Caluza)", { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 18, align: "center", color: "666666" });

    // 10. The Human Factor
    slide = pres.addSlide();
    slide.addText("It Only Works if Staff Can Do It", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "Challenge: Shifting from \"command & control\" to \"coaching & connection.\"", options: { bullet: true } },
        { text: "Method: Behavioral Skills Training (BST).", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 18 }
    );

    // 11. The Coaching Model
    slide = pres.addSlide();
    slide.addText("Teaching Staff to \"Drop the Rope\"", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "Instruction, Modeling, Rehearsal, Feedback.", options: { bullet: true } },
        { text: "Tools: Fidelity Checklists, Coaching Logs.", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 18 }
    );
    slide.addText("[PLACEHOLDER: Fidelity Checklist Snapshot]", { x: 0.5, y: 4, w: 9, h: 0.5, fontSize: 12, italic: true, color: "999999", align: "center" });

    // Section Divider: Outcomes (Rob)
    slide = pres.addSlide();
    slide.background = { color: "F1F5F9" };
    slide.addText("Part 4: Outcomes & Social Validity", { x: 0.5, y: 2, w: 9, h: 1, fontSize: 32, bold: true, align: "center", color: "363636" });
    slide.addText("Evaluating the Model (Rob Spain)", { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 18, align: "center", color: "666666" });

    // 13. Aggregate Outcomes
    slide = pres.addSlide();
    slide.addText("Does It Work?", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "CPFQ Scores: Increasing Psychological Flexibility.", options: { bullet: true } },
        { text: "Externalizing Behavior: Decreasing.", options: { bullet: true } },
        { text: "Academic Tolerance: Increasing work completion.", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 2, fontSize: 18 }
    );
    slide.addText("[PLACEHOLDER: Graph of Aggregate Data]", { x: 0.5, y: 4, w: 9, h: 0.5, fontSize: 12, italic: true, color: "999999", align: "center" });

    // 15. Conclusion
    slide = pres.addSlide();
    slide.addText("The Future of School-Based ABA", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
    slide.addText(
      [
        { text: "1. Assess the Thought.", options: { bullet: true } },
        { text: "2. Intervene with Values.", options: { bullet: true } },
        { text: "3. Train with Compassion.", options: { bullet: true } },
        { text: "4. Measure the Life Change.", options: { bullet: true } }
      ],
      { x: 0.5, y: 1.5, w: 9, h: 3, fontSize: 18 }
    );

    // 16. Q&A
    slide = pres.addSlide();
    slide.addText("Q&A", { x: 0.5, y: 2, w: 9, h: 1, fontSize: 32, bold: true, align: "center", color: "363636" });
    slide.addText("Spain-R@KCUSD.com | Lopez-CR@KCUSD.com", { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 14, align: "center" });

    pres.writeFile({ fileName: "CALABA_2026_Presentation.pptx" });
});
