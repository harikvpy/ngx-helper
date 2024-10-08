import { TestBed } from "@angular/core/testing";
import { SPCurrencyPipe } from "./currency.pipe";
import { setSPI18nConfig } from "./providers";

describe('SPCurrencyPipe', () => {

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        SPCurrencyPipe
      ],
    });
  })

  it('should return empty string for empty values', () => {
    setSPI18nConfig({ locale: 'en-US', currency: 'USD'} );
    const pipe = new SPCurrencyPipe();
    const strAmount = pipe.transform(null as any);
    expect(strAmount).toEqual('')
  });

  it('should return sentinel string for NaN', () => {
    setSPI18nConfig({ locale: 'en-US', currency: 'USD'} );
    const pipe = new SPCurrencyPipe();
    const strAmount = pipe.transform('alsdf' as any);
    expect(strAmount).toEqual('****.**')
  });

  it('should use locale from global SPNgxI18nConfig object', () => {
    setSPI18nConfig({ locale: 'en-US', currency: 'USD'} );
    const pipe = new SPCurrencyPipe();
    const value = 938930490.39;
    const strAmount = pipe.transform(value);
    expect(strAmount?.startsWith('$')).toBeTrue();
    expect(strAmount).toEqual('$938,930,490.39');
  });

  it('should use locale & currency from global SPNgxI18nConfig object', () => {
    setSPI18nConfig({ locale: 'en-IN', currency: 'INR'} );
    const pipe = new SPCurrencyPipe();
    const value = 938930490.39;
    const strAmount = pipe.transform(value);
    expect(strAmount?.startsWith('₹')).toBeTrue();
    // Note how the amount is formatted differently when compared to the
    // previous test.
    expect(strAmount).toEqual('₹93,89,30,490.39');
  });

  it('should use locale & currency from global SPNgxI18nConfig object', () => {
    setSPI18nConfig({ locale: 'ja-JP', currency: 'CNY'} );
    const pipe = new SPCurrencyPipe();
    const value = 938930490.39;
    const strAmount = pipe.transform(value);
    expect(strAmount?.startsWith('元')).toBeTrue();
    expect(strAmount?.split('元')[1].trim()).toEqual('938,930,490.39');
  });

});
