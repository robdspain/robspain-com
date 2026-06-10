document.getElementById("download-pptx").addEventListener("click", async () => {
    let pres = new PptxGenJS();

    const response = await fetch("/data/calaba-2026-slides.json");
    const data = await response.json();

    const addTitleSlide = (slideData) => {
        const slide = pres.addSlide();
        slide.addText(slideData.title, { x: 0.5, y: 1, w: 9, h: 1.5, fontSize: 32, bold: true, align: "center", color: "363636" });
        if (slideData.subtitle) {
            slide.addText(slideData.subtitle, { x: 0.5, y: 2.5, w: 9, h: 0.5, fontSize: 18, align: "center", color: "666666" });
        }
        if (slideData.byline) {
            slide.addText(slideData.byline, { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 14, align: "center" });
        }
        if (slideData.footer) {
            slide.addText(slideData.footer, { x: 0.5, y: 4, w: 9, h: 0.5, fontSize: 14, align: "center" });
        }
    };

    const addSectionSlide = (slideData) => {
        const slide = pres.addSlide();
        slide.background = { color: "F1F5F9" };
        slide.addText(slideData.title, { x: 0.5, y: 2, w: 9, h: 1, fontSize: 32, bold: true, align: "center", color: "363636" });
        if (slideData.subtitle) {
            slide.addText(slideData.subtitle, { x: 0.5, y: 3.2, w: 9, h: 0.5, fontSize: 18, align: "center", color: "666666" });
        }
    };

    const addContentSlide = (slideData) => {
        const slide = pres.addSlide();
        slide.addText(slideData.title, { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true, color: "363636" });
        if (slideData.subtitle) {
            slide.addText(slideData.subtitle, { x: 0.5, y: 1.1, w: 9, h: 0.4, fontSize: 16, italic: true, color: "666666" });
        }
        if (slideData.bullets?.length) {
            slide.addText(
                slideData.bullets.map((text) => ({ text, options: { bullet: true } })),
                { x: 0.5, y: slideData.subtitle ? 1.7 : 1.5, w: 9, h: 3, fontSize: 18 }
            );
        }
        if (slideData.note) {
            slide.addText(slideData.note, { x: 0.5, y: 4.5, w: 9, h: 0.5, fontSize: 12, italic: true, color: "999999", align: "center" });
        }
    };

    data.slides.forEach((slideData) => {
        if (slideData.type === "title") {
            addTitleSlide(slideData);
            return;
        }
        if (slideData.type === "section") {
            addSectionSlide(slideData);
            return;
        }
        addContentSlide(slideData);
    });

    pres.writeFile({ fileName: "CALABA_2026_Presentation.pptx" });
});
