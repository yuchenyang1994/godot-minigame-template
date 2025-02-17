# Godot小游戏模板

这个是微信小游戏的转换模板，主要修改了godot.js这个胶水层并新增加载godot引擎的逻辑和一些sdk，模板在这里维护方便后续版本的更新。也可能增加其他平台小游戏的模板一并放在这里维护。

## 编译wasm

本仓库不提供编译的wasm，并在gitignore中排除了pck包和wasm，需要你自己编译。

### 如何编译wasm？

参考godot官方文档[https://docs.godotengine.org/en/stable/contributing/development/compiling/compiling_for_web.html](https://docs.godotengine.org/en/stable/contributing/development/compiling/compiling_for_web.html)

但是直接编译会没有声音，需要修改引擎

1. 在源码的os_web.cpp中把scriptprocessor的音频驱动添加回来

   ```c
   if (AudioDriverWeb::is_available()) {
   	audio_drivers.push_back(memnew(AudioDriverWorklet));
   	audio_drivers.push_back(memnew(AudioDriverScriptProcessor));// 这里需要再加一个ScriptProcessor
   }
   for (AudioDriverWeb *audio_driver : audio_drivers) {
   	AudioDriverManager::add_driver(audio_driver);
   }
   ```

2. 因为godot官方已经把这个驱动废弃了，但是代码没废弃，所以头文件有问题，你需要再platform/web/audio_driver.h中把这个finish_driver删除

   ```c
   class AudioDriverScriptProcessor : public AudioDriverWeb {
   private:
    static void _process_callback();

    static AudioDriverScriptProcessor *singleton;

   protected:
     virtual Error create(int &p_buffer_size, int p_output_channels) override;
     virtual void start(float *p_out_buf, int p_out_buf_size, float *p_in_buf, int p_in_buf_size) override;
     virtual void finish_driver() override; // 这里要删除

   public:
    virtual const char *get_name() const override { return "ScriptProcessor"; }

    virtual void lock() override {}
    virtual void unlock() override {}

    static AudioDriverScriptProcessor *get_singleton() { return singleton; }
    AudioDriverScriptProcessor() { singleton = this; }
   };
   ```

按照官方指引编译即可

### 你的编译模板是什么？

根据官方指引，需要修改`custom.py`中增加编译模板

```py
threads = "no" # 重点！
platform = "web"
extra_suffix = "minigame"
production = "yes"
optimize = "size"
module_mobile_vr_enabled = "no"
module_openxr_enabled = "no"
module_webxr_enabled = "no"
module_text_server_adv_enabled = "no"
module_text_server_fb_enabled = "yes"
module_webrtc_enabled = "no"
```
