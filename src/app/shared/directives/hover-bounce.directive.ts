import { Directive, ElementRef, HostListener, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appHoverBounce]',
  standalone: true
})
export class HoverBounceDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-4px) scale(1.02)');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)');
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'none');
  }
}
