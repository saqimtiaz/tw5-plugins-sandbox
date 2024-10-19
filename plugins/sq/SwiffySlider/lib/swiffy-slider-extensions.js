export const swiffysliderextensions = function() {
    return {
        version: "1.6.0",
        draggingtimer: null,
        init(rootElement = document.body) {
            for (const sliderElement of rootElement.querySelectorAll(".swiffy-slider")) {
                this.initSlider(sliderElement);
            }
        },

        initSlider(sliderElement) {
            if (sliderElement.classList.contains("slider-nav-mousedrag"))
                sliderElement.addEventListener("mousedown", (e) => this.handleMouseDrag(e, sliderElement), { passive: true });
        },

        handleMouseDrag(e, sliderElement) {
            if (e.srcElement.classList.contains('slider-nav') || e.srcElement.classList.contains('tc-tiddylink') || $tw.utils.domMatchesSelector(e.srcElement,"a,button") || e.srcElement.parentElement.classList.contains('slider-indicators'))
                return;

            const container = sliderElement.querySelector(".slider-container");
            if (sliderElement.classList.contains("dragging")) {
                clearTimeout(this.draggingtimer);
            }
            container.style.cursor = "grabbing";
            sliderElement.classList.add("dragging");

            const startingLeftPos = container.scrollLeft;
            const mouseDownStartingXPos = e.clientX;
            const slideWidth = container.children[0].offsetWidth + parseInt(window.getComputedStyle(container).columnGap);
            const maxLeftPosition = slideWidth * (container.children.length - 1);
            const startLeftScroll = container.scrollLeft;
            let nextSlideLeftPos = startLeftScroll;

            const moveDelegate = (e) => {
                const mouseMovedXpos = e.clientX - mouseDownStartingXPos;
                const nextDraggingLeftPosition = startingLeftPos - (mouseMovedXpos * 1.8);

                if (nextDraggingLeftPosition > 0 && nextDraggingLeftPosition <= maxLeftPosition) {
                    container.scrollLeft = nextDraggingLeftPosition;
                } else {
                    return;
                }
                if (mouseMovedXpos < 0) {
                    //Dragging from right to left
                    if (maxLeftPosition <= startLeftScroll) {
                        //Dragging right on last slide which is should not try to move the slides
                        nextSlideLeftPos = startLeftScroll;
                    } else {
                        nextSlideLeftPos = container.scrollLeft + (slideWidth + (mouseMovedXpos * 1.8));
                    }
                } else {
                    //Dragging from left to right
                    if (startLeftScroll > 0) {
                        nextSlideLeftPos = container.scrollLeft - (slideWidth - (mouseMovedXpos * 1.8));
                    }
                }
            }

            container.addEventListener('mousemove', moveDelegate, { passive: true });
            document.addEventListener('mouseup', () => {
                container.removeEventListener('mousemove', moveDelegate);
                container.style.cursor = null;
                if (nextSlideLeftPos < 0) { nextSlideLeftPos = 0; }
                container.scroll({
                    left: nextSlideLeftPos,
                    behavior: "smooth"
                });
                this.draggingtimer = setTimeout(() => { sliderElement.classList.remove("dragging"); }, 550);
            }, { once: true, passive: true });
        }
    };
}();