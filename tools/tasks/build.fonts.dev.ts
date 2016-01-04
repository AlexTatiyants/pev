import {join} from 'path';
import {APP_SRC, APP_DEST} from '../config';

export = function buildFontsDev(gulp, plugins) {
  return function () {
    return gulp.src([
        join(APP_SRC, '**/*.eot'),
        join(APP_SRC, '**/*.ttf'),
        join(APP_SRC, '**/*.woff'),
        join(APP_SRC, '**/*.woff2'),
        join(APP_SRC, '**/*.otf')
      ])
      .pipe(gulp.dest(APP_DEST));
  };
}
