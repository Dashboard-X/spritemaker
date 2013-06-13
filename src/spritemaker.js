﻿//debug
//(function(EC) {

	//addClass, hasClass
	(function DomClassFns(){
		if (HTMLElement) {
			
			HTMLElement.prototype.addClass = function(cls) {
				var reg = new RegExp('\\b' + cls + '\\b');
				if (!reg.test(this.className))
					this.className += ' ' + cls;
			}
			HTMLElement.prototype.hasClass = function(cls) {
				var reg = new RegExp('\\b' + cls + '\\b');
				return reg.test(this.className);
			}
			HTMLElement.prototype.delClass = function(cls) {
				var reg = new RegExp('\\b' + cls + '\\b', 'g');
				this.className = this.className.replace(reg, '');
			}
		}
	})();

	var Spriter = {
		curTab: 0,

		curStep: 0,

		init: function() {
			this.defineGraph();
			this.init1();
			this.bindStep();
		},

		defineGraph: function() {
			var This = this;

			this.Graph = EC.Graph.extend({
				initData: function(ctx) {
					this.imgdata = ctx.getImageData(this.x, this.y, this.w, this.h);
				},
				path: function(ctx) {
					ctx.rect(this.x, this.y, this.w, this.h);
				},
				renderFn: function() {
					if (This.curTab == 0) {
						this.ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
					} else {
						this.ctx.putImageData(this.imgdata, this.x, this.y, 0, 0, this.w, this.h);
					}
				},
				draggable: true,
				dragMode: 'normal'
			});
		},

		init1: function() {
			this.panel = document.querySelectorAll('.panel')[this.curTab];
			this.steps = this.panel.querySelectorAll('.step');
			this.bindResize();
			this.bindUpload1();
			this.btnEvents1();
			this.curX = this.curY = this.maxY = 0;
		},

		btnEvents1: function() {
			var clip = this.panel.querySelector('.btn-clip'),
				update = this.panel.querySelector('.btn-update'),
				This = this;

			clip.addEventListener('click', function() {
				This.clip();
			}, false);
			update.addEventListener('click', function() {
				This.updateCss();
			}, false);
		},

		initLayer: function() {
			this.viewport = document.querySelector('#viewport');
			this.result = document.querySelector('.result');

			if (this.curTab == 0) {
				this.viewport.style.width = this._btnWidth1.value + 'px';
				this.viewport.style.height = this._btnHeight1.value + 'px';
			}
			this.result.addClass('active');
			this.layer = new EC.Layer('view');
		},

		bindStep: function() {
			var btnPrev = document.querySelectorAll('.btn-prev'),
				btnNext = document.querySelectorAll('.btn-next'),
				This = this;

			[].forEach.call(btnPrev, function(v, i) {
				v.addEventListener('click', function(e) {
					if (v.hasClass('disable')) {return;}
					This.steps[This.curStep--].delClass('active');
					This.steps[This.curStep].addClass('active');
				}, false);
			});

			[].forEach.call(btnNext, function(v, i) {
				v.addEventListener('click', function(e) {
					if (v.hasClass('disable')) {return;}
					This.steps[This.curStep++].delClass('active');
					This.steps[This.curStep].addClass('active');
				}, false);
			});
		},

		bindUpload1: function() {
			var btn = document.querySelector('#upload1'),
				This = this;

			btn.addEventListener('change', function(e) {
				var files = this.files,
					i = 0,
					imgs = [];
				
				[].forEach.call(files, function(v) {
					var img = document.createElement('img'),
						reader = new FileReader(),
						name = v.name.match(/.*(?=\.\w+$)/)[0];

					if (!/^image\/\w+$/.test(v.type)) {
						alert(v.name + '不是图片哦');
					}

					img.onload = function() {
						imgs.push({
							img: this,
							width: this.width,
							height: this.height,
							name: name
						});
						if (imgs.length == files.length) {
							if (!This.layer) {
								This.initLayer();
							}
							This.render1(imgs);
						}
					};

					reader.onload = function(e) {
						img.src = e.target.result;
					};

					reader.readAsDataURL(v);
				});
			});
		},

		bindResize: function() {
			var This = this;
			this._btnWidth1 = document.querySelector('.set-width1');
			this._btnHeight1 = document.querySelector('.set-height1');
			this._btnPadding1 = document.querySelector('.set-padding1');

			this.padding1 = parseInt(this._btnPadding1.value);
				

			this._btnWidth1.addEventListener('change', function() {
				if (This.layer) {
					EC.Layer.viewport.resize({'width': parseInt(this.value)}, This.layer.ctx);
				}
			});

			this._btnHeight1.addEventListener('change', function() {
				if (This.layer) {
					EC.Layer.viewport.resize({'height': parseInt(this.value)}, This.layer.ctx);
				}
			});
			this._btnPadding1.addEventListener('change', function() {
				if (This.layer) {
					This.padding1 = parseInt(this.value);
				}
			});
		},

		render1: function(imgs) {
			var This = this;

			//active next
			this.steps[this.curStep].querySelector('.btn-next').delClass('disable');

			imgs.forEach(function(v) {
				This.curY = This.curX + v.width > EC.Layer.viewport.width ? This.maxY : This.curY;
				This.curX = This.curX + v.width > EC.Layer.viewport.width ? 0 : This.curX;
				
				var graph = new This.Graph({
					x: This.curX,
					y: This.curY,
					w: v.width,
					h: v.height,
					img: v.img,
					name: v.name
				}).render(This.layer.ctx);

				This.curX += v.width + This.padding1;
				This.maxY = Math.max(This.maxY, This.curY + v.height + This.padding1);

				if (This.maxY > This.layer.canvas.height) {
					EC.Layer.viewport.resize({'height': This.maxY}, This.layer.ctx);
				}
			});

			this.updateUrl();
			this.updateCss();
		},

		clip: function() {
			var ctx = this.layer.ctx,
				minX = Math.min.apply({}, ctx.graphs.map(function(v) {return v.x})),
				minY = Math.min.apply({}, ctx.graphs.map(function(v) {return v.y})),
				maxX = Math.max.apply({}, ctx.graphs.map(function(v) {return v.x + v.w})),
				maxY = Math.max.apply({}, ctx.graphs.map(function(v) {return v.y + v.h}));
			
			ctx.save();
			EC.Layer.viewport.resize({'width': maxX - minX, 'height': maxY - minY});
			ctx.translate(-minX, -minY);
			ctx.reRender();
			ctx.restore();
			this.updateUrl();
		},

		updateUrl: function() {
			var btn = document.querySelectorAll('.btn-down')[this.curTab],
				data = this.layer.canvas.toDataURL('image/png'),
				downmime = 'image/octet-stream';

			data = data.replace(/image\/\w+/, downmime);
			btn.href = data;
			btn.download = "custom.png";
		},

		updateCss: function() {
			var detector = document.getElementById('ec_detector'),
				pre = document.querySelector('.set-prefix1').value,
				ind = document.querySelector('.set-name-rule1').selectedIndex,
				codes = document.getElementById('spriteCode'),
				txt = '',
				bgtxt = '',
				len = this.layer.ctx.graphs.length,
				coma = len == 1 ? '' : ',';

			if (detector) {
				detector.style.display = 'none';
			}

			this.layer.ctx.graphs.forEach(function(v, i) {
				var x = v.x ? '-' + v.x + 'px' : '0',
					y = v.y ? '-' + v.y + 'px' : '0',
					last = ind == 0 ? v.name : i,
					cls = '.' + pre + last;

				txt += '\n' + cls + ' {\n';
				txt += '  width: ' + v.w + 'px;\n';
				txt += '  height: ' + v.h + 'px;\n';
				txt += '  background-position: ' + x + ' ' + y + ';\n';
				txt += '}\n';

				if (i != len - 1) {
					bgtxt += cls + coma + '\n';
				} else {
					bgtxt += cls + ' {\n';
					bgtxt += '  background: url(yourspriteimageurl) -9999px -9999px no-repeat;\n';
					bgtxt += '}\n';
				}
			});

			codes.innerHTML = bgtxt + txt;

		}
	};

	Spriter.init();

//})(EC);