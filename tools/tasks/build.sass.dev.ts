import {join} from 'path';
import {APP_SRC} from '../config';

export = function buildSassDev(gulp, plugins, option) {
    return function() {
        return gulp.src(join(APP_SRC, '**', '*.scss'))
            .pipe(plugins.plumber({
                // this allows gulp not to crash on sass compilation errors
                errorHandler: function(error) {
                    console.log(error.message);
                    this.emit('end');
                }
            }))
            .pipe(plugins.compass({
                style: 'compressed',
                css: 'app/assets/css',
                sass: join(APP_SRC, 'assets/sass')
            }))
            .pipe(gulp.dest(join(APP_SRC, 'assets')));
    };
}
