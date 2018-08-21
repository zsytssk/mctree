import { zutil } from './zutil';
import * as template from 'art-template';

template.defaults.minimize = true;
template.defaults.htmlMinifierOptions = {
    minimize: true,
    collapseWhitespace: true,
    // 运行时自动合并：rules.map(rule => rule.test)
    ignoreCustomFragments: [],
};
var NotifyItem = (function(_super) {
    var Pool = [];
    var FONTSIZE = null;
    var COLOR = null;

    function NotifyItem(data) {
        NotifyItem.super(this);

        this.htmlElement = null;

        this.init(data);
    }
    Laya.class(NotifyItem, '', _super);
    var _proto = NotifyItem.prototype;

    _proto.init = function(data) {
        this.setup();
        this.setText(data);
    };
    _proto.setText = function(html) {
        this.htmlElement.innerHTML = html;
        this.size(
            this.htmlElement.contextWidth,
            this.htmlElement.contextHeight,
        );
    };
    _proto.setup = function() {
        var htmlElement = new Laya.HTMLDivElement();
        htmlElement.style.fontSize = FONTSIZE;
        htmlElement.style.color = COLOR;
        htmlElement.style.whiteSpace = 'nowrap';

        this.htmlElement = htmlElement;
        this.addChild(htmlElement);
    };
    _proto.reset = function(data) {
        this.setText(data);
        return this;
    };
    _proto.recover = function() {
        this.removeSelf();
        Pool.push(this);
    };

    NotifyItem.setup = function(fontSize, color) {
        FONTSIZE = fontSize;
        COLOR = color;
    };
    NotifyItem.create = function(data) {
        if (Pool.length !== 0) {
            return Pool.pop().reset(data);
        } else {
            return new NotifyItem(data);
        }
    };
    NotifyItem.clear = function() {
        for (var i in Pool) {
            Pool[i].destroy(true);
        }
        Pool.length = 0;
    };

    return NotifyItem;
})(Laya.Box);

var NotifyPanel = (function(_super) {
    function NotifyPanel(height, margin) {
        NotifyPanel.super(this);

        this.height = height;
        this.margin = margin;
    }
    Laya.class(NotifyPanel, '', _super);
    var _proto = NotifyPanel.prototype;
    _proto.destroy = function() {
        _super.prototype.destroy.call(this);
    };
    _proto.addNotify = function(notifyItem) {
        notifyItem.x = this.width;

        this.width += notifyItem.width + this.margin;
        this.addChild(notifyItem);
    };
    _proto.removeNotify = function() {
        this.getChildAt(0).recover();

        for (var i = this.numChildren - 1; i >= 0; i--) {
            this.getChildAt(i).x += this.x;
        }

        this.width += this.x;
        this.x = 0;
    };

    return NotifyPanel;
})(Laya.Box);

var Pool = [];
var NotifyList = [];
var DEFAULT_CONFIG = {
    width: 580,
    fontSize: 30,
    color: '#ffffff', //公告内容的默认颜色
    repeat: true, //是否允许重复的公告
    type: 'single', //single : 单条   multiple : 多条连续
    margin: 50,
    stroke: 3,
    tpl: null, //公告模板，例如 "<span style='color:#fff'>恭喜<font style='color:#fc0'>{userName}</font>获得<font style='#ff0'>{msg}</font></span>"
    speed: 100, //每隔1ms移动的像素
    delay: 200, //每条公告间隔的时间
    complete: function() {
        console.log('公告列表为空，已执行回调函数.');
    },
};

export class Notify extends Laya.Box {
    constructor(config) {
        super();

        this.CONFIG = null;
        this.notifyPanel = null;
        this.isAnimation = false;
        this.templateFn = null;

        this.init(config);
    }
    destroy() {
        super.destroy(true);
        this.CONFIG = null;
    }
    init(config) {
        config = zutil.extend(DEFAULT_CONFIG, config);

        this.CONFIG = config;
        this.size(config.width, config.fontSize);
        this.scrollRect = {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height + 5,
        };

        this.notifyPanel = new NotifyPanel(config.fontSize, config.margin);
        this.addChild(this.notifyPanel);

        if (config.tpl) {
            this.templateFn = template.compile(config.tpl);
        } else {
            console.warn('没有配置tpl字段，将不使用模板变量。');
        }

        NotifyItem.setup(config.fontSize, config.color);
    }
    addData(data) {
        var html = this.templateFn ? this.templateFn(data) : data;

        //不添加重复内容
        if (!this.CONFIG.repeat) {
            for (var i in NotifyList) {
                if (NotifyList[i] === html) {
                    return;
                }
            }
        }

        NotifyList.push(html);
    }
    createNotify(type) {
        var limit = 0;
        switch (this.CONFIG.type) {
            case 'single':
                if (this.notifyPanel.numChildren !== 0) {
                    return;
                }
                limit = 1;
                break;
            case 'multiple':
                if (this.notifyPanel.numChildren >= 10) {
                    return;
                }
                limit = 10;
                break;
        }

        while (NotifyList.length && limit) {
            this.notifyPanel.addNotify(NotifyItem.create(NotifyList.shift()));
            limit--;
        }
    }
    next() {
        if (this.notifyPanel.numChildren === 0 && NotifyList.length === 0) {
            console.log('公告列表为空，执行回调函数.');
            this.CONFIG.complete &&
                typeof this.CONFIG.complete === 'function' &&
                this.CONFIG.complete();
            return;
        }
        if (this.isAnimation) {
            return;
        }
        this.isAnimation = true;

        this.createNotify();

        var itemWidth = this.notifyPanel.getChildAt(0).width;
        var totalTime = (itemWidth / this.CONFIG.speed) * 1000;

        if (this.CONFIG.type === 'single') {
            this.notifyPanel.x = this.width;
            totalTime += (this.width / this.CONFIG.speed) * 1000;
        }

        Laya.Tween.to(
            this.notifyPanel,
            {
                x: -itemWidth - this.CONFIG.margin,
            },
            totalTime,
            null,
            Laya.Handler.create(this, function() {
                this.notifyPanel.removeNotify();
                this.isAnimation = false;

                this.next();
            }),
            this.CONFIG.delay,
        );
    }
    add(data) {
        if (data instanceof Array) {
            for (var i in data) {
                this.addData(data[i]);
            }
            this.createNotify();
            this.next();
        } else {
            this.addData(data);
            this.createNotify();
            this.next();
        }
    }
}
