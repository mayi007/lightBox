;(function($) {

    var LightBox = function(settings) {
        var self = this;

        //参数配置
        this.settings={
            speed:500,
            heightScale:0.6
        }
        $.extend(this.settings, settings||{});
        

        //遮罩层和弹出层
        this.popupMask = $('<div id="G-lightbox-mask">');
        this.popupWin = $('<div id="G-lightbox-popup">');

        //页面对象
        this.bodyNode = $(document.body);

        //渲染遮罩层和弹出层
        this.renderDom();

        //获取弹出层的所有对象
        this.picViewArea = this.popupWin.find('div.lightbox-pic-view'); //图片预览区域
        this.popupPic = this.popupWin.find('img.lightbox-image'); //图片
        this.popupCaptionArea = this.popupWin.find('div.lightbox-pic-caption'); //图片描述区域
        this.prevBtn = this.popupWin.find('span.lightbox-prev-btn');
        this.nextBtn = this.popupWin.find('span.lightbox-next-btn');
        this.captionText = this.popupWin.find('p.lightbox-pic-desc'); //图片表述
        this.currentIndex = this.popupWin.find('span.lightbox-of-index'); //图片当前索引
        this.closeBtn = this.popupWin.find('div.lightbox-close-btn'); //关闭按钮

        this.groupName = null;
        this.groupData = []; //放置同一组数据
        //准备开发事件委托获取组数据
        this.bodyNode.on('click', '.js-lightbox,*[data-role=lightbox]', function(e) {
            //阻止事件冒泡
            e.stopPropagation();
            var currentGroupName = $(this).attr('data-group');
            self.groupName = currentGroupName;

            //根据当前组名获取同一组数据
            self.getGroup();

            //初始化弹框
            self.initPopup($(this));
        });
    };

    LightBox.prototype = {
        renderDom: function() {
            var strDom='<div class="lightbox-pic-view">'+
							'<span class="lightbox-btn lightbox-prev-btn"></span>'+
							'<img class="lightbox-image">'+
							'<span class="lightbox-btn lightbox-next-btn"></span>'+
						'</div>'+
						'<div class="lightbox-pic-caption">'+
							'<div class="lightbox-caption-area">'+
								'<p class="lightbox-pic-desc"></p>'+
								'<span class="lightbox-of-index"></span>'+
							'</div>'+
							'<div class="lightbox-close-btn"></div>'+
						'</div>';
            this.popupWin.html(strDom);
            this.bodyNode.append(this.popupMask, this.popupWin);
        },
        getGroup: function() {
            var self = this;
            var groupList = this.bodyNode.find('*[data-group=' + this.groupName + ']');

            //先清空数组数据
            this.groupData.length = 0;
            // //添加数据
            groupList.each(function(index, el) {
                self.groupData.push({
                    src: $(this).attr('data-source'),
                    id: $(this).attr('data-id'),
                    caption: $(this).attr('data-caption')
                });
            });
        },
        initPopup: function(currentObj) {
            var sourceSrc = currentObj.attr('data-source');
            var currentId = currentObj.attr('data-id');
            this.showMaskAndPopup(sourceSrc, currentId);
        },
        showMaskAndPopup: function(sourceSrc, currentId) {
        	var self=this;

        	//隐藏图片区和图片简介区
        	this.popupPic.hide();
        	this.popupCaptionArea.hide();

        	//让遮罩层和弹出层淡入
        	this.popupMask.fadeIn()
        	this.popupWin.fadeIn();

        	//视口宽高
        	var winWidth=$(window).width(),
        		winHeight=$(window).height();

        	//设置图片区域宽高
        	this.picViewArea.css({
        		width:winWidth/2,
        		height:winHeight/2
        	});

        	var viewHeight=winHeight/2+10;//当前弹出框的高度

        	//设置弹出层宽高，并让其居住显示
        	this.popupWin.css({
        		width:winWidth/2+10,
        		height:winHeight/2+10,
        		marginLeft:-(winWidth/2+10)/2,
        		top:-viewHeight
        	}).animate({
        		top:(winHeight-viewHeight)/2
        	},self.settings.speed,function(){
        		//加载图片
        		self.loadPicSize(sourceSrc);
        	});

        	//根据点击当前元素，获取当前组别的索引
        	this.index=this.getIndexOf(currentId);

        	//为了方便后面绑定前后切换按钮，给按钮判断添加disabled属性
        	var groupDataLength=this.groupData.length;
        	//判断图片是否大于1张
        	if(groupDataLength>1){
        		//当图片在第一张时
        		if(this.index==0){
        			this.prevBtn.addClass('disabled');
        			this.nextBtn.removeClass('disabled');
        		}else if(this.index>=groupDataLength-1){
        			//当图片大于等于最后一张时
        			this.prevBtn.removeClass('disabled');
        			this.nextBtn.addClass('disabled');
        		}else{
        			//其他情况
        			this.prevBtn.removeClass('disabled');
        			this.nextBtn.removeClass('disabled');        		}
        	}
        },
        getIndexOf:function(currentId){
        	var index;
        	$(this.groupData).each(function(i, el) {
        		index=i;
        		if(this.id===currentId){
        			return false;   //将停止循环
        		}
        	});
        	return index;
        },
        loadPicSize:function(sourceSrc){
        	var self=this;
        	
            //解决图片变形问题，原因下一个图片会继承上一个图片
            //宽高，方法：把上一次图片宽高清空
            self.popupPic.css({
                width:'auto',
                height:'auto'
            }).hide();

            //图片未加载进来时，让它隐藏，以白屏显示
            this.popupCaptionArea.hide();

        	//图片预加载
        	this.preLoadImg(sourceSrc,function(){
    
        		//修改图片的src，值为sourceSrc
        		self.popupPic.attr('src',sourceSrc);

        		//获取图片宽高，将值传入changePic函数中
        		var picWidth=self.popupPic.width(),
        			picHeight=self.popupPic.height();
        		self.changePic(picWidth,picHeight);
        	})
        },
        preLoadImg:function(src,callback){
        	var self=this;

        	//实例化img
        	var img=new Image();

        	//监听图片加载完成后，执行回调函数callback
        	//针对IE
        	if(!!window.ActiveXObject){
        		img.onreadystatechange=function(){
        			if(this.readyState=='complete'){
        				callback();
        			}
        		}
        	}else{
        		//针对其他浏览器
     			img.onload=function(){
     				callback();
     			}
        	}
        	//设置img的src
        	img.src=src;	
        },
        changePic:function(picWidth,picHeight){
        	var self=this,
        		winWidth=$(window).width(),
        		winHeight=$(window).height();

        	//根据浏览器视口比例来调整图片比例,比例为scale
        	var scale=Math.min(winWidth/(picWidth+10),winHeight/(picHeight+10),1);
        	
        	//设置图片宽高比例
        	picWidth*=scale;
        	picHeight*=scale*this.settings.heightScale;

    		//给图片区设置宽高动画
    		this.picViewArea.animate({
    			width:picWidth-10,   //这里-10的原因是刚用弹出层计算比例
    			height:picHeight-10
    		},self.settings.speed);

    		//给弹出层设置宽高,居中动画
    		this.popupWin.animate({
    			width:picWidth,
    			height:picHeight,
    			marginLeft:-(picWidth/2),
    			top:(winHeight-picHeight)/2
    		},self.settings.speed,function(){
    			//在回调函数中给图片宽高添加动画，并让其淡入
    			self.popupPic.animate({
    				width:picWidth-10,
    				height:picHeight-10
    			},self.settings.speed).fadeIn();
    			//同时让图片描述区淡入
    			self.popupCaptionArea.fadeIn();
    			self.flag=true;
                self.clear=true;
    		})

    		//设置描述文字和当前索引
    		this.captionText.text(this.groupData[this.index].caption);	
    		this.currentIndex.text('当前索引：'+(this.index+1)+' of '+this.groupData.length);

    		//点击遮罩层让遮罩层和弹出层淡出
    		this.popupMask.click(function(){
    			$(this).fadeOut();
    			self.popupWin.fadeOut();
                self.clear=false; //关闭时不再执行window的resize方法
    		});
    		//点击关闭按钮让遮罩层和弹出层淡出
    		this.closeBtn.click(function(){
    			self.popupMask.fadeOut();
    			self.popupWin.fadeOut();
                self.clear=false;//关闭时不再执行window的resize方法
    		});

    		//绑定上下切换按钮事件
    		this.flag=true  //设置一个避免重复点击的判断

    		//给前切换按钮绑定鼠标滑动和点击事件
    		this.prevBtn.hover(function() {
    			if(!$(this).hasClass('disabled')&&self.groupData.length>1){
    				$(this).addClass('lightbox-prev-btn-show');
    			}
    		}, function() {
    			$(this).removeClass('lightbox-prev-btn-show');
    		}).click(function(e){
    			if(!$(this).hasClass('disabled')&&self.flag){
    				e.stopPropagation();
    				self.flag=false;   //避免重复点击
    				self.goto('prev');
    			}
    		});

    		//给后切换按钮绑定鼠标滑动和点击事件
    		this.nextBtn.hover(function() {
    			if(!$(this).hasClass('disabled')&&self.groupData.length>1){
    				$(this).addClass('lightbox-next-btn-show');
    			}
    		}, function() {
    			$(this).removeClass('lightbox-next-btn-show');
    		}).click(function(e){
    			if(!$(this).hasClass('disabled')&&self.flag){
    				e.stopPropagation();
    				self.flag=false;   //避免重复点击
    				self.goto('next');
    			}
    		});

            //绑定窗口调整事件
            var timer=null;
            this.clear=false;
            $(window).resize(function(event) {
                if(self.clear){
                    //通过设置定时器来解决
                    window.clearTimeout(timer);
                    timer=window.setTimeout(function(){
                        //这里会有一个性能问题，动画反复执行
                        self.loadPicSize(self.groupData[self.index].src);
                    },500);
                }
            }).keyup(function(event) {
                //绑定键盘事件，前后切换图片
                //console.log(event.which);//键盘码
                var keyValue=event.which;
                if(self.clear){
                    //左箭头切换
                    if(keyValue=='37'){
                        self.prevBtn.click();
                    }else if(keyValue=='39'){
                        //右箭头切换
                        self.nextBtn.click();
                    }
                }
                    
            });
        },
        goto:function(direction){
        	if(direction=='prev'){
        		this.index--;
                if(this.groupData.length>1){
                    //当小于等于第一张图片时
                    if(this.index<=0){
                        this.prevBtn.addClass('disabled').removeClass('lightbox-prev-btn-show');
                        this.nextBtn.removeClass('disabled').addClass('lightbox-next-btn-show')
                    }else if(this.index>=this.groupData.length-1){
                        //当大于等于最后一张图片时
                        this.prevBtn.removeClass('disabled').addClass('lightbox-prev-btn-show');
                        this.nextBtn.addClass('disabled').removeClass('lightbox-next-btn-show');
                    }else{
                        //其他情况时
                        this.prevBtn.removeClass('disabled').addClass('lightbox-prev-btn-show');
                        this.nextBtn.removeClass('disabled').addClass('lightbox-next-btn-show');
                    }

                    //修改图片地址
                    var newSrc=this.groupData[this.index].src;
                    this.loadPicSize(newSrc);
                }else{
                    this.prevBtn.removeClass('lightbox-prev-btn-show');
                    this.nextBtn.removeClass('lightbox-next-btn-show');
                }
        		

        	}else if(direction=='next'){
        		this.index++;
                //当一组图片大于一张时
                if(this.groupData.length>1){
                    //当小于等于第一张图片时
                    if(this.index<=0){
                        this.prevBtn.addClass('disabled').removeClass('lightbox-prev-btn-show');
                        this.nextBtn.removeClass('disabled').addClass('lightbox-next-btn-show')
                    }else if(this.index>=this.groupData.length-1){
                        //当大于等于最后一张图片时
                        this.prevBtn.removeClass('disabled').addClass('lightbox-prev-btn-show');
                        this.nextBtn.addClass('disabled').removeClass('lightbox-next-btn-show');
                    }else{
                        //其他情况时
                        this.prevBtn.removeClass('disabled').addClass('lightbox-prev-btn-show');
                        this.nextBtn.removeClass('disabled').addClass('lightbox-next-btn-show');
                    }

                    //修改图片地址
                    var newSrc=this.groupData[this.index].src;
                    this.loadPicSize(newSrc);
                }else{
                    //当一组图片等于一张时
                    this.prevBtn.removeClass('lightbox-prev-btn-show');
                    this.nextBtn.removeClass('lightbox-next-btn-show');
                }
        	}
        }
    }


    window['LightBox'] = LightBox;


})(jQuery);
