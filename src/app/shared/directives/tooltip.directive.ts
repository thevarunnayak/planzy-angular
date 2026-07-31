import { Directive, ElementRef, HostListener, Input, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective {
  @Input('appTooltip') tooltipText = '';

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private tooltipEl: HTMLElement | null = null;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.tooltipText) return;
    this.createTooltip();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.destroyTooltip();
  }

  private createTooltip(): void {
    this.tooltipEl = this.renderer.createElement('div');
    this.renderer.appendChild(this.tooltipEl, this.renderer.createText(this.tooltipText));

    this.renderer.setStyle(this.tooltipEl, 'position', 'fixed');
    this.renderer.setStyle(this.tooltipEl, 'background', '#1E2638');
    this.renderer.setStyle(this.tooltipEl, 'color', '#F1F5F9');
    this.renderer.setStyle(this.tooltipEl, 'padding', '6px 12px');
    this.renderer.setStyle(this.tooltipEl, 'border-radius', '10px');
    this.renderer.setStyle(this.tooltipEl, 'font-size', '0.75rem');
    this.renderer.setStyle(this.tooltipEl, 'font-weight', '800');
    this.renderer.setStyle(this.tooltipEl, 'z-index', '100000');
    this.renderer.setStyle(this.tooltipEl, 'box-shadow', '0 8px 20px rgba(0, 0, 0, 0.35)');
    this.renderer.setStyle(this.tooltipEl, 'pointer-events', 'none');
    this.renderer.setStyle(this.tooltipEl, 'white-space', 'nowrap');
    this.renderer.setStyle(this.tooltipEl, 'border', '1px solid #2E3A52');

    const rect = this.el.nativeElement.getBoundingClientRect();
    
    // Position BELOW the element so top navbar tooltips are 100% visible!
    const topPos = rect.bottom + 8;
    const leftPos = rect.left + rect.width / 2;

    this.renderer.setStyle(this.tooltipEl, 'top', `${topPos}px`);
    this.renderer.setStyle(this.tooltipEl, 'left', `${leftPos}px`);
    this.renderer.setStyle(this.tooltipEl, 'transform', 'translateX(-50%)');

    this.renderer.appendChild(document.body, this.tooltipEl);
  }

  private destroyTooltip(): void {
    if (this.tooltipEl) {
      this.renderer.removeChild(document.body, this.tooltipEl);
      this.tooltipEl = null;
    }
  }
}
