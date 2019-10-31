const MAT = new matIV();

window.addEventListener('DOMContentLoaded', () => {
    let webgl = new WebGLFrame();
    webgl.init('webgl-canvas');

    webgl.load().then(() => {
        webgl.setup();
        webgl.render();
    });
}, false);

class WebGLFrame {

    constructor(){
        this.canvas     = null;
        this.gl         = null;
        this.running    = false;
        this.beginTime  = 0;
        this.nowTime    = 0;
        this.mousX      = null;
        this.mousY      = null;

        this.mMatrix = MAT.identity(MAT.create());
        this.vMatrix = MAT.identity(MAT.create());
        this.pMatrix = MAT.identity(MAT.create());
        this.vpMatrix = MAT.identity(MAT.create());
        this.mvpMatrix = MAT.identity(MAT.create());

        // self binding
        this.render = this.render.bind(this);
    }

    init(canvas){
        // キャンバスオブジェクト取得
        if(canvas instanceof HTMLCanvasElement === true){
            this.canvas = canvas;
        } else if (Object.prototype.toString.call(canvas) === '[object String]'){
            let c = document.querySelector(`#${canvas}`);
            if (c instanceof HTMLCanvasElement === true){
                this.canvas = c;
            }
        }
        if (this.canvas == null){
            throw new Error('invalid argument.');
        }

        // WebGLRenderringContext　オブジェクト取得
        this.gl = this.canvas.getContext('webgl');

        if(this.gl == null){
            throw new Error('webgl not supported.')
        }
    }

    load(){
        // ロード完了後に必要となるプロパティを初期化
        this.program        = null;
        this.attLocation    = null;
        this.attStride      = null;
        this.uniLocation    = null;
        this.uniType        = null;

        return new Promise((resolve) => {
            this.loadShader([
                './vertex.vert',
                './fragment.frag'
            ])
            .then((shaders) => {
                let gl = this.gl;

                // 頂点シェーダオブジェクト フラグメントシェーダオブジェクト生成
                let vertex_shader = this.createShader(shaders[0], gl.VERTEX_SHADER);
                let fragment_shader = this.createShader(shaders[1], gl.FRAGMENT_SHADER);
                // プログラムオブジェクト生成
                this.program = this.createProgram(vertex_shader, fragment_shader);

                // 頂点シェーダに渡すプロパティを定義
                this.attLocation = [
                    gl.getAttribLocation(this.program, 'position'),
                    gl.getAttribLocation(this.program, 'color')
                ];

                this.attStride = [
                    3,
                    3
                ];

                this.uniLocation = [
                    gl.getUniformLocation(this.program, 'time'),
                    gl.getUniformLocation(this.program, 'mouse_position'),
                    gl.getUniformLocation(this.program, 'res'),
                    gl.getUniformLocation(this.program, 'mvpMatrix')
                ];

                this.uniType = [
                    'uniform1f',
                    'uniform2fv',
                    'uniform2fv',
                    'uniformMatrix4fv'
                ];

                // 必要情報の宣言が問題なく完了したら Promise を解決
                resolve();
            })
        });
    }

    setup(){
        let gl = this.gl;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.offsetX / this.canvas.width;
            this.mouseY = e.offsetY / this.canvas.height;
        }, false);

        this.vertex_position = [
            -1.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,

            -1.0, 1.0, -1.0,
            1.0, 1.0, -1.0,
            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0, 
        ]; 

        this.index = [
            2,1,0,
            2,3,1,
            3,5,1,
            3,7,5,
            4,5,7,
            6,7,4,
            0,4,6,
            6,2,0,
            0,5,4,
            0,1,5,
            6,3,7,
            2,3,6
        ];

        this.ibo = this.createIbo(this.index);
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        // gl.enable(gl.DEPTH_TEST);
        // gl.disable(gl.CULL_FACE);

        this.runnning = true;
        this.beginTime = Date.now();

    }

    render(){
        let gl = this.gl;

        this.nowTime = (Date.now() - this.beginTime) / 1000;

        this.vertex_color = [
            Math.random(), Math.random, 1.0,
            Math.random(), Math.random, 1.0,
            Math.random(), Math.random, 1.0,
            Math.random(), Math.random, 1.0,
            Math.random(), Math.random, 1.0,
            Math.random(), Math.random, 1.0,
            Math.random(), Math.random, 1.0,
            Math.random(), Math.random, 1.0,
            Math.random(), Math.random, 1.0,
        ];

        this.vbo = [        
            this.createVbo(this.vertex_position),
            this.createVbo(this.vertex_color)
        ];
        
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program);
        this.setAttribute(this.vbo, this.attLocation, this.attStride, this.ibo);
       
        gl.clear(gl.COLOR_BUFFER_BIT);

        let cameraPosition      = [0.0, 0.0, 4.0];
        let centerPoint         = [0.0, 0.0, 0.0];
        let cameraUpDirection   = [0.0, 1.0, 0.0];
        let cameraScale         = 1;
        let fovy    = 60 * cameraScale;
        let aspect  = this.canvas.width / this.canvas.height;
        let near    = 0.1;
        let far     = 10.0;

        MAT.lookAt(cameraPosition, centerPoint, cameraUpDirection, this.vMatrix);
        MAT.perspective(fovy, aspect, near, far, this.pMatrix);
        MAT.multiply(this.pMatrix, this.vMatrix, this.vpMatrix);

        var radian = (this.nowTime % 360) * Math.PI / 180;
        MAT.identity(this.mMatrix);
        MAT.rotate(this.mMatrix, radian * 30, [0, 1, 0], this.mMatrix);
        MAT.rotate(this.mMatrix, radian * 30, [1, 0, 0], this.mMatrix);
        MAT.multiply(this.vpMatrix, this.mMatrix, this.mvpMatrix);

        this.setUniform([
            this.nowTime,
            [this.mouseX, this.mouseY],
            [this.canvas.width, this.canvas.height],
            this.mvpMatrix
        ], this.uniLocation, this.uniType);

        gl.drawElements(gl.TRIANGLES, this.index.length, gl.UNSIGNED_SHORT, 0);

        gl.flush();

        setTimeout(this.render, 1000 / 2000);   
    }

    /**
     * シェーダのソースコードを外部ファイルから取得する
     * @param {Array.<string>} pathArray - シェーダを記述したファイルパス
     * @return {Promise}
     */
    loadShader(pathArray){
        if(Array.isArray(pathArray) !== true){
            throw new Error('invalid argument.');
        }

        let promises = pathArray.map((path) => {
            return fetch(path).then((response) => {
                return response.text();
            });
        });

        return Promise.all(promises);
    }

    /**
     * シェーダオブジェクトを生成 & コンパイル
     * コンパイル失敗時はエラーログを表示し、nullを返す
     * @param {string} source   - シェーダソースコード
     * @param {number} type     - gl.VERTEX_SHADER or gl.FRSGMENT_SHADER
     * @return {WebGLShader}    - シェーダオブジェクト  
     */
    createShader(source, type){
        if(this.gl == null){
            throw new Error('webgl not initialized.');
        }

        let gl = this.gl;
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            return shader;
        }else{
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
    }

    /**
     * 頂点シェーダオブジェクト, フラグメントシェーダオブジェクト を受け取り、プログラムオブジェクトを生成
     * @param {WebGLShader} vertex_shader       - 頂点シェーダオブジェクト
     * @param {WebGLShader} fragment_shader     - フラグメントシェーダオブジェクト
     * @return {WebGLProgram} - プログラムオブジェクト
     */
    createProgram(vertex_shader, fragment_shader){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        let gl = this.gl;

        // プログラムオブジェクトを生成し、各シェーダをリンク
        let program = gl.createProgram();
        gl.attachShader(program, vertex_shader);
        gl.attachShader(program, fragment_shader);
        gl.linkProgram(program);

        // リンクに成功したらプログラムオブジェクトを有効化. 失敗の場合はnullを返す
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
            gl.useProgram(program)
            return program;
        }else{
            alert(gl.getProgramInfoLog(program));
            return null;
        }
    }

    /**
     * VBOを生成して返す
     * @param {Array} data - 頂点属性データを格納した配列
     * @return {WebGLBuffer} Vertex Buffer Object
     */
    createVbo(data){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        let gl = this.gl;
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }

    /**
     * IBOを生成して返す
     * @param {Array} data - インデックスデータを格納した配列
     * @return {WebGLBuffer} Index Buffer Object
     */
    createIbo(data){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        let gl = this.gl;
        let ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return ibo;
    }

    /**
     * IBOを生成して返す  ※ INT拡張版
     * @param {Array} data - インデックスデータを格納した配列
     * @return {WebGLBuffer} IBO 
     */
    createIboInt(data){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        let gl = this.gl;

        if(ext == null || ext.elementIndexUnit == null){
            throw new Error('element index Unit not supported');
        }

        let ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gk.ELEMENT_ARRAY_BUFFER, new Uint32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        return ibo;
    }

    /**
     * 画像ファイルを読み込み、テクスチャを生成してコールバックで返却する
     * @param {string} source 
     * @return {Promis}
     */
    createTextureFromFile(source){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        return new Promis((resolve) => {
            let gl = this.gl;
            let img = new Image();

            img.addEventListener('load', () => {

                let texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINER);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINER);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.bindTexture(gl.TEXTURE_2D, null);
                resolve(texture);

            }, false);

            img.src = source;
        });
    }

    /**
     * フレームバッファを生成して返す。
     * @param {number} width    - フレームバッファの幅
     * @param {number} height   - フレームバッファの高さ
     * @return {object} 生成した各種オブジェクトをラップして返す
     * @property {WebGLFramebuffer} framebuffer - フレームバッファ
     * @property {WebGLRenderbuffer} renderbuffer - 深度バッファとして設定したレンダーバッファ
     * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
     */
    crateFrameBuffer(width, height){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        let gl = this.gl;

        let frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        let depthRenderBuffer = gl.createRenderbuffer();
        gl.bindRenderBuffer(gl.RENDERBUFFER, depthRenderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);

        let fTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return {framebuffer: frameBuffer, renderbuffer: depthRenderBuffer, texture: fTexture};
    }

    /**
     * フレームバッファを生成して返す ※フロートテクスチャ
     * @param {object} ext - getWebGLExtentions の戻り値
     * @param {number} width - フレームバッファの幅
     * @param {number} height - フレームバッファの高さ
     * @return {object} 生成した各種オブジェクトをラップして返す
     * @property {WebGLFramebuffer} frameBuffer - フレームバッファ
     * @property {WebGLTexture} texture - カラーバッファとして設定したテクスチャ
     */
    createFramebufferFloat(ext, width, height){
        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        let gl = this.gl;

        if(ext == null || (ext.textureFloat == null && ext.textureHalfFloat == null)){
            throw new Error('float texture not supported.');
        }

        let flg = (ext.textureFloat != null) ? gl.FLOAT : ext.textureHalfFloat.HALF_FLOAT_OES;
        let frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        let fTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, flg, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return {framebuffer: frameBuffer, texture: fTexture};
    }

    /**
     * VBO IBO をバインドして有効化する
     * @param {Array} vbo 
     * @param {Array} attL 
     * @param {Array} attS 
     * @param {WebGLBuffer} ibo 
     */
    setAttribute(vbo, attL, attS, ibo){

        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        let gl = this.gl;

        vbo.forEach((v, index) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, v);
            gl.enableVertexAttribArray(attL[index]);
            gl.vertexAttribPointer(attL[index], attS[index], gl.FLOAT, false, 0, 0);
        });

        if(ibo != null){
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        }
    }

    /**
     * uniform 変数をまとめてシェーダに送る
     * @param {Array} value - 各変数の値
     * @param {Array} uniL - uniform location を格納した配列
     * @param {Array} uniT - uniform 変数のタイプを格納した配列
     */
    setUniform(value, uniL, uniT){

        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        let gl = this.gl;

        value.forEach((v, index) => {
            let type = uniT[index];
            if(type.includes('Matrix') === true){
                gl[type](uniL[index], false, v);
            }else{
                gl[type](uniL[index], v);
            }
        });

    }

    /**
     * 主要なWebGLの拡張機能を取得する
     * @return      {object}    - 取得した拡張機能をラップして返す
     * @property    {object}    elementIndexUint    - Unit32 フォーマットを利用できるようにする
     * @property    {object}    textureFloat        - フロートテクスチャを利用できるようにする
     * @property    {object}    textureHalfFloat    - ハーフフロートテクスチャを利用できるようにする
     */
    getWebGLExtentions(){

        if(this.gl == null){
            throw new Error('webgl not initialized');
        }

        let gl = this.gl;

        return {
            elementIndexUint:   gl.getExtension('OES_element_index_uint'),
            textureFloat:       gl.getExtension('OES_texture_float'),
            textureHalfFloat:   gl.getExtension('OES_texture_half_float')
        };

    }

    getRandom(){
        return Math.random();
    }
}