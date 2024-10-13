import { TestBed } from "@angular/core/testing";
import { SPDatePipe } from "./date.pipe";
import { setSPI18nConfig } from "./providers";

fdescribe('SPDatePipe', () => {

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        SPDatePipe
      ],
    });
  })

  it('should return empty string for empty values', () => {
    setSPI18nConfig({ locale: 'en-US', currency: 'USD', datetimeFormat: 'shortDate' } );
    const pipe = new SPDatePipe();
    const strAmount = pipe.transform(null as any);
    expect(strAmount).toEqual('')
  });

  it('should return sentinel string for NaN', () => {
    setSPI18nConfig({ locale: 'en-US', currency: 'USD', datetimeFormat: 'shortDate' } );
    const pipe = new SPDatePipe();
    const strAmount = pipe.transform('alsdf' as any);
    expect(strAmount).toEqual('******')
  });

  it('should use locale from global SPNgxI18nConfig object', () => {
    const pipe = new SPDatePipe();
    // Day of the month is in the range 0-30!
    const date = new Date(Date.UTC(2020, 11, 20, 0, 0, 0, 0));
    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'short', timezone: 'Asia/Taipei' } );
    let strAmount = pipe.transform(date);
    expect(strAmount).toEqual('12/20/2020, 8:00 AM');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'short', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('2020/12/20 上午8:00');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'medium', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('Dec 20, 2020, 8:00:00 AM');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'medium', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('2020年12月20日 上午8:00:00');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'long', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('December 20, 2020 at 8:00:00 AM GMT+8');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'long', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('2020年12月20日 上午8:00:00 [GMT+8]');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'full', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('Sunday, December 20, 2020 at 8:00:00 AM GMT+08:00');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'shortDate', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('12/20/2020');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'shortDate' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('2020/12/20');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'mediumDate'} );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('Dec 20, 2020');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'mediumDate'} );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('2020年12月20日');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'longDate', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('December 20, 2020');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'longDate', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('2020年12月20日');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'shortTime', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('8:00 AM');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'shortTime', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('上午8:00');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'mediumTime', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('8:00:00 AM');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'mediumTime', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('上午8:00:00');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'longTime', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('8:00:00 AM GMT+8');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'longTime', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('上午8:00:00 [GMT+8]');

    setSPI18nConfig({ locale: 'en-US', datetimeFormat: 'fullTime', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('8:00:00 AM GMT+08:00');
    setSPI18nConfig({ locale: 'zh-TW', datetimeFormat: 'fullTime', timezone: 'Asia/Taipei' } );
    strAmount = pipe.transform(date);
    expect(strAmount).toEqual('上午8:00:00 [GMT+08:00]');
  });

});
