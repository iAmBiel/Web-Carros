import { Container } from '../../../components/container'
import { DashboardHeader } from '../../../components/panelheader'
import { FiTrash, FiUpload } from 'react-icons/fi'
import { useForm } from 'react-hook-form'
import { Input } from '../../../components/input'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChangeEvent, useState, useContext, useEffect } from 'react'
import { AuthContext } from '../../../contexts/AuthContext'
import { v4 as uuidV4 } from 'uuid'
import { storage, db } from '../../../services/firebaseConnection'
import { ref, uploadBytes,  getDownloadURL, deleteObject } from 'firebase/storage'
import { addDoc, collection, doc, updateDoc, getDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

const schema = z.object({
  name: z.string().nonempty('O campo nome é obrigatório'),
  model: z.string().nonempty('O campo modelo é obrigatório'),
  year: z.string().nonempty('O campo ano é obrigatório'),
  km: z.string().nonempty('O campo km é obrigatório'),
  price: z.string().nonempty('O campo preço é obrigatório'),
  city: z.string().nonempty('O campo cidade é obrigatório'),
  whatsapp: z.string().min(1, 'O campo telefone é obrigatório').refine((value) => /^(\d{11,12})$/.test(value), {
    message: 'Número de telefone inválido'
  }),
  description: z.string().nonempty('O campo descrição é obrigatório')
})

type FormData = z.infer<typeof schema>

interface ImageItemProps{
  uid: string;
  name: string;
  previewUrl: string;
  url: string;
}

export function EditCar(){

    const { user } = useContext(AuthContext)
    const { id } = useParams<{id: string}>()

    const [carImages, setCarImages] = useState<ImageItemProps[]>([])

    const { register, handleSubmit, formState: { errors }, reset} = useForm<FormData>({
      resolver: zodResolver(schema),
      mode: 'onChange'
    })

    useEffect(() => {
      // Função para obter os dados do carro pelo id e preencher o formulário
      async function fetchCarData() {
        const carRef = doc(db, 'cars', id);
        const carSnapshot = await getDoc(carRef);

        if (carSnapshot.exists()) {
          const carData = carSnapshot.data();

          // Preenche os valores do formulário com os dados do carro
          setValue('name', carData.name);
          setValue('model', carData.model);
          setValue('year', carData.year);
          setValue('km', carData.km);
          setValue('price', carData.price);
          setValue('city', carData.city);
          setValue('whatsapp', carData.whatsapp);
          setValue('description', carData.description);

          // Preenche as imagens do carro para exibição
          setCarImages(carData.images || []);
        }
      }

      fetchCarData();
    }, [id, setValue]);

    async function handleFile(e: ChangeEvent<HTMLInputElement>){
      if(e.target.files && e.target.files[0]){
        const image = e.target.files[0]

        if(image.type === 'image/jpeg' || image.type === 'image/png'){
          await handleUpload(image)
        }else{
          alert("Envie uma imagem jpeg ou png!")
          return;
        }
      } 
    }

    async function handleUpload(image: File){
      if(!user?.uid){
        return;
      }

      const currentUid = user?.uid;
      const uidImage = uuidV4();

      const uploadRef = ref(storage, `images/${currentUid}/${uidImage}` )

      uploadBytes(uploadRef, image)
      .then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadUrl) => {
          const imageItem = {
            name: uidImage,
            uid: currentUid,
            previewUrl: URL.createObjectURL(image),
            url:  downloadUrl
          }

          setCarImages((images) => [...images, imageItem] )
          toast.success('Imagem cadastrada com sucesso!')
          
        })
      })

    }

    function onSubmit(data: FormData){
      if(carImages.length === 0){
        toast.error('Envie pelo menos uma imagem!')
        return;
      }

      const carListImages = carImages.map( car => {
        return {
          uid: car.uid,
          name: car.name,
          url: car.url
        }
      })

      addDoc(collection(db, 'cars'), {
        name: data.name.toUpperCase(),
        model: data.model,
        whatsapp: data.whatsapp,
        city: data.city,
        year: data.year,
        km: data.km,
        price: data.price,
        description: data.description,
        created: new Date(),
        owner: user?.name,
        uid: user?.uid,
        images: carListImages
      })
      .then(() => {
        reset();
        setCarImages([]);
        toast.success('Carro  cadastrado com sucesso!');
        console.log('cadastrado')
      })
      .catch((error) => {
        toast.error('Erro ao cadastrar carro!')
        console.log(error)
      })

    }

    async function handleDeleteImage(item: ImageItemProps){
      const imagePath = `images/${item.uid}/${item.name}`

      const imageRef =  ref(storage, imagePath);

      try{

        await deleteObject(imageRef)
        setCarImages(carImages.filter((car) => car.url !== item.url))

      }catch(error){

        console.log(error)

      }
    }

    return(
      <Container>

        <DashboardHeader/>

        <div className='w-full bg-white p-3 rounded-lg flex flex-col sm:flex-row items-center gap-2'>

          <button className='border-2 w-48 rounded-lg flex items-center justify-center cursor-pointer border-gray-600 h-32 md:w-48'>

            <div className='absolute cursor-pointer'>
              <FiUpload size={30} color='#000'/>
            </div>

            <div className='cursor-pointer'>
              <input type='file' accept='image/*' className='opacity-0 cursor-pointer' onChange={handleFile}/>
            </div>

          </button>

          {carImages.map(item => (
            <div key={item.name} className='w-full h-32 flex items-center justify-center relative'>
              <button className='absolute' onClick={() => handleDeleteImage(item) }>
                <FiTrash size={28} color='#Fff'/>
              </button>
              <img src={item.previewUrl} alt='Foto do carro' className='rounded-lg w-full h-32 object-cover'/>
            </div>
          ))}

        </div>

        <div className='w-full bg-white p-3 rounded-lg flex flex-col sm:flex-row items-center gap-2 mt-2'>

          <form className='w-full' onSubmit={handleSubmit(onSubmit)}>

            <div className='mb-3'>

              <p className='mb-2 font-medium'>Nome do carro</p>
              <Input
                type='text'
                register={register}
                name='name'
                error={errors.name?.message}
                placeholder='Ex: Onix 1.0...'
              />

            </div>

            <div className='mb-3'>

              <p className='mb-2 font-medium'>Modelo do carro</p>
              <Input
                type='text'
                register={register}
                name='model'
                error={errors.model?.message}
                placeholder='Ex: 1.0 Flex Plus Manual...'
              />

            </div>

            <div className='flex w-full mb-3 flex-row items-center gap-4'>

              <div className='w-full'>

                <p className='mb-2 font-medium'>Ano</p>
                <Input
                  type='text'
                  register={register}
                  name='year'
                  error={errors.year?.message}
                  placeholder='Ex: 2023/2024...'
                />

              </div>

              <div className='w-full'>

                <p className='mb-2 font-medium'>KM rodados</p>
                <Input
                  type='text'
                  register={register}
                  name='km'
                  error={errors.km?.message}
                  placeholder='Ex: 23.900...'
                />

              </div>

            </div>

            <div className='flex w-full mb-3 flex-row items-center gap-4'>

              <div className='w-full'>

                <p className='mb-2 font-medium'>Telefone / Whatsapp</p>
                <Input
                  type='text'
                  register={register}
                  name='whatsapp'
                  error={errors.whatsapp?.message}
                  placeholder='Ex: 011999101923...'
                />

              </div>

              <div className='w-full'>

                <p className='mb-2 font-medium'>Cidade</p>
                <Input
                  type='text'
                  register={register}
                  name='city'
                  error={errors.city?.message}
                  placeholder='Ex: Fortaleza - CE...'
                />

              </div>

            </div>

            <div className='mb-3'>

              <p className='mb-2 font-medium'>Preço</p>
              <Input
                type='text'
                register={register}
                name='price'
                error={errors.price?.message}
                placeholder='Ex: 69.000...'
              />

            </div>

            <div className='mb-3'>

              <p className='mb-2 font-medium'>Descrição</p>
              <textarea
                className='border-2 w-full rounded-md h-24 px-2'
                {...register('description')}
                name='description'
                id='description'
                placeholder='Digite a descrição completa sobre o carro...'
              />
              {errors.description && <p className='mb-1 text-red-500'>{errors.description.message}</p>}

            </div>

            <button type='submit' className='w-full rounded-md bg-zinc-900 text-white font-medium h-10'>
              Editar
            </button>

          </form>

        </div>
      </Container>
    )
}